import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { adminEmployeeService } from '../../services/adminEmployeeService';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Select,
  Th,
  Td,
  Tr,
  PageLoader,
  Loader,
  EmptyState,
  Pagination,
} from '../../components/admin';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const DEFAULT_LIMIT = 20;
const ALLOWED_LIMITS = [10, 20, 50, 100];
const SEARCH_DEBOUNCE_MS = 350;

/* ─── Source detection ───────────────────────────────────────────────────────
 *
 * Internal candidates come from the admin manual flow → they carry
 * internalPlan{Id,RefId} on the API response (camelCase or snake_case).
 * Everything else is treated as External.
 *
 * Kept as a defensive client-side fallback in case a row predates the
 * server-side `candidateType` field being populated.
 */
function getCandidateType(e) {
  const internal =
    e?.internalPlanId != null ||
    e?.internalPlanRefId != null ||
    e?.internal_plan_id != null ||
    e?.internal_plan_ref_id != null ||
    e?.source === 'INTERNAL' ||
    e?.candidateType === 'INTERNAL';
  return internal ? 'INTERNAL' : 'EXTERNAL';
}

/* ─── Status badge variant map ─────────────────────────────────────────── */
function enrollmentBadgeVariant(status) {
  const map = {
    NEW:       'info',
    ACTIVE:    'success',
    PENDING:   'warning',
    CANCELLED: 'danger',
    COMPLETED: 'neutral',
  };
  return map[status] ?? 'neutral';
}

/* ─── Sync status badge ────────────────────────────────────────────────── */
const SYNC_BADGE = {
  PENDING:     { variant: 'warning', label: 'Sync pending' },
  SUCCESS:     { variant: 'success', label: 'Synced' },
  FAILED:      { variant: 'warning', label: 'Sync failed' },
  DEAD_LETTER: { variant: 'danger',  label: 'Sync dead-letter' },
};

/**
 * Short, human-readable error label derived from a sync log row.
 *   - HTTP 404 / 401 / 500              — preserves status code
 *   - "Breaker is open"                 — circuit breaker tripped
 *   - "Sumago API request timed out…"   — collapsed to "Timeout"
 *   - Anything else                     — first 40 chars of the raw error
 */
function shortSyncError(lastSync) {
  if (!lastSync) return null;
  if (lastSync.statusCode) return `HTTP ${lastSync.statusCode}`;
  const raw = (lastSync.error || '').trim();
  if (!raw) return null;
  if (/timed?\s*out|timeout|ETIMEDOUT|AbortError/i.test(raw)) return 'Timeout';
  if (/breaker.*open/i.test(raw))                              return 'Breaker open';
  if (/ECONNREFUSED|ENOTFOUND|ECONN/i.test(raw))               return 'Connection error';
  return raw.length > 40 ? raw.slice(0, 40) + '…' : raw;
}

/**
 * SyncBadgeWithDiagnostics — badge + inline error subtitle + hover tooltip.
 * Production SaaS pattern: surface root cause at the row level.
 */
function SyncBadgeWithDiagnostics({ status, label, variant, lastSync }) {
  const [copied, setCopied] = useState(false);
  const errLabel = shortSyncError(lastSync);
  const isFailureState = status === 'FAILED' || status === 'DEAD_LETTER';
  const attemptedAt = lastSync?.attemptedAt ? new Date(lastSync.attemptedAt) : null;

  const copyEndpoint = async (e) => {
    e.stopPropagation();
    if (!lastSync?.endpoint) return;
    try {
      await navigator.clipboard.writeText(lastSync.endpoint);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = lastSync.endpoint;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="group relative inline-flex flex-col items-start gap-0.5">
      <Badge variant={variant}>{label}</Badge>

      {isFailureState && errLabel && (
        <span className="text-[10px] text-slate-500 leading-tight">
          {errLabel}
          {lastSync?.attempts > 0 && (
            <span className="text-slate-400"> · {lastSync.attempts} attempt{lastSync.attempts === 1 ? '' : 's'}</span>
          )}
        </span>
      )}

      {lastSync && (
        <div
          className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-150
                     absolute z-30 left-0 top-full mt-1 w-96 p-3 rounded-lg
                     bg-slate-900 text-white text-xs shadow-xl"
        >
          <div className="font-semibold text-slate-100 mb-1.5">
            {errLabel || 'Last sync attempt'}
          </div>
          <dl className="space-y-1 text-slate-300">
            <DiagRow k="State"      v={lastSync.logStatus} mono />
            <DiagRow k="Attempts"   v={lastSync.attempts != null ? String(lastSync.attempts) : '—'} />
            {lastSync.statusCode != null && <DiagRow k="HTTP" v={String(lastSync.statusCode)} />}
            {attemptedAt && <DiagRow k="When" v={attemptedAt.toLocaleString()} />}
            {lastSync.endpoint && (
              <div className="flex gap-2">
                <dt className="text-slate-400 w-16 shrink-0">Endpoint</dt>
                <dd className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5">
                    <code className="flex-1 min-w-0 font-mono text-[11px] text-slate-100 break-all select-all bg-slate-800 px-1.5 py-0.5 rounded">
                      {lastSync.endpoint}
                    </code>
                    <button
                      type="button"
                      onClick={copyEndpoint}
                      className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors"
                      title="Copy endpoint to clipboard"
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <a
                    href={lastSync.endpoint}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block mt-1 text-[10px] text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
                  >
                    Open in new tab ↗
                  </a>
                </dd>
              </div>
            )}
            {lastSync.error && (
              <div className="pt-1 mt-1 border-t border-slate-700">
                <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Error</div>
                <div className="font-mono text-[11px] text-slate-100 break-words select-all">
                  {lastSync.error}
                </div>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

function DiagRow({ k, v, mono, truncate }) {
  return (
    <div className="flex gap-2">
      <dt className="text-slate-400 w-16 shrink-0">{k}</dt>
      <dd className={`text-slate-100 flex-1 select-all ${mono ? 'font-mono' : ''} ${truncate ? 'truncate' : ''}`}>
        {v}
      </dd>
    </div>
  );
}

/* ─── Column count ─────────────────────────────────────────────────────── */
const COLS = 12; // Sr No + Enrollment ID + Name + Email + Phone + Type + Active Plan + Status + Sync + Assignee + Created + actions

/* ─── URL-query helpers ────────────────────────────────────────────────── */
/**
 * Parse pagination / filter state out of `?page=…&limit=…&…` so reloading or
 * sharing the link preserves the view. Falls back to defaults for missing
 * or malformed values.
 */
function readQueryState(searchParams) {
  const limit = Number(searchParams.get('limit'));
  const page  = Number(searchParams.get('page'));
  return {
    page:          Number.isFinite(page) && page >= 1 ? page : 1,
    limit:         ALLOWED_LIMITS.includes(limit) ? limit : DEFAULT_LIMIT,
    search:        searchParams.get('q')      ?? '',
    candidateType: searchParams.get('type')   ?? 'ALL',
    status:        searchParams.get('status') ?? 'ALL',
    syncStatus:    searchParams.get('sync')   ?? 'ALL',
    fromDate:      searchParams.get('from')   ?? '',
    toDate:        searchParams.get('to')     ?? '',
    assignedTo:    searchParams.get('assignee') ?? 'ALL',
  };
}

/**
 * Compress current state into URLSearchParams. Omits default values so the
 * URL stays clean when no filters are applied.
 */
function writeQueryState(state) {
  const params = new URLSearchParams();
  if (state.page > 1)               params.set('page', String(state.page));
  if (state.limit !== DEFAULT_LIMIT) params.set('limit', String(state.limit));
  if (state.search)                  params.set('q', state.search);
  if (state.candidateType !== 'ALL') params.set('type', state.candidateType);
  if (state.status !== 'ALL')        params.set('status', state.status);
  if (state.syncStatus !== 'ALL')    params.set('sync', state.syncStatus);
  if (state.fromDate)                params.set('from', state.fromDate);
  if (state.toDate)                  params.set('to', state.toDate);
  if (state.assignedTo && state.assignedTo !== 'ALL') params.set('assignee', state.assignedTo);
  return params;
}

/* ─── Main page ────────────────────────────────────────────────────────── */
export default function Enrollments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Initial state lives in the URL — bookmarks + page reloads preserve view.
  const initialState = useMemo(() => readQueryState(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [page,          setPage]          = useState(initialState.page);
  const [limit,         setLimit]         = useState(initialState.limit);
  const [search,        setSearch]        = useState(initialState.search);
  const [candidateType, setCandidateType] = useState(initialState.candidateType);
  const [status,        setStatus]        = useState(initialState.status);
  const [syncStatus,    setSyncStatus]    = useState(initialState.syncStatus);
  const [fromDate,      setFromDate]      = useState(initialState.fromDate);
  const [toDate,        setToDate]        = useState(initialState.toDate);
  // Lead-ownership filter — 'ALL' (default), 'unassigned', or an employee UUID.
  // URL-persisted via the same initialState pattern; defaults to 'ALL' so
  // existing bookmarks/links don't break.
  const [assignedTo,    setAssignedTo]    = useState(initialState.assignedTo ?? 'ALL');

  // Employee list for the assignee filter dropdown + per-row Assign control.
  // Loaded once; fail-soft (we render an empty list and disable the controls).
  const [employees,     setEmployees]     = useState([]);
  // Per-row spinner so the Assign select can show a tiny loading hint.
  const [assigningIds,  setAssigningIds]  = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    adminEmployeeService.list({ activeOnly: true, limit: 500 })
      .then((res) => { if (!cancelled) setEmployees(res?.rows ?? []); })
      .catch(() => { /* not fatal — Assignee dropdown just stays empty */ });
    return () => { cancelled = true; };
  }, []);

  /**
   * Debounced search term. The raw `search` state updates every keystroke
   * so the input remains responsive, but `debouncedSearch` (which feeds
   * the API) only updates ~350ms after the user stops typing. This keeps
   * the server from being hammered while someone is mid-word.
   */
  const [debouncedSearch, setDebouncedSearch] = useState(initialState.search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  /* Per-row spinner + optimistic sync override state for the Retry button. */
  const [retryingIds,    setRetryingIds]    = useState(new Set());
  const [optimisticSync, setOptimisticSync] = useState({});

  /* ── Sync URL with state ────────────────────────────────────────────── */
  // Use a ref to skip the very first render (we already loaded from URL),
  // then write whenever state actually changes.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const next = writeQueryState({
      page,
      limit,
      search: debouncedSearch,
      candidateType,
      status,
      syncStatus,
      fromDate,
      toDate,
      assignedTo,
    });
    setSearchParams(next, { replace: true });
  }, [page, limit, debouncedSearch, candidateType, status, syncStatus, fromDate, toDate, assignedTo, setSearchParams]);

  /* ── Filters → server query ─────────────────────────────────────────── */
  const filters = useMemo(() => ({
    page,
    limit,
    ...(debouncedSearch.trim().length >= 1 ? { search: debouncedSearch.trim() } : {}),
    ...(candidateType !== 'ALL'           ? { candidateType, source: candidateType } : {}),
    ...(status        !== 'ALL'           ? { status } : {}),
    ...(syncStatus    !== 'ALL'           ? { externalSyncStatus: syncStatus } : {}),
    ...(fromDate                          ? { fromDate } : {}),
    ...(toDate                            ? { toDate }   : {}),
    ...(assignedTo    !== 'ALL'           ? { assignedTo } : {}),
  }), [page, limit, debouncedSearch, candidateType, status, syncStatus, fromDate, toDate, assignedTo]);

  // One row PER EMAIL (latest enrollment + enrollmentCount). Deduped globally
  // on the server, so a re-enrolling student appears once; the count badge and
  // the per-row history link reveal the rest.
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminService.listEnrollmentsGrouped(filters)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters, reloadKey]);

  /* ── Read server response ───────────────────────────────────────────── */
  const items      = Array.isArray(data?.items) ? data.items : [];
  const total      = Number(data?.total ?? 0);
  const totalPages = Math.max(1, Number(data?.totalPages ?? 1));
  // Clamp page to server-reported totalPages so a stale URL like `?page=999`
  // after filters narrow the result set doesn't strand the user on an empty
  // page with no way back. Effect runs only when totalPages changes.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  /* ── Reset filters ─────────────────────────────────────────────────── */
  const filtersActive =
    candidateType !== 'ALL' ||
    status        !== 'ALL' ||
    syncStatus    !== 'ALL' ||
    assignedTo    !== 'ALL' ||
    fromDate ||
    toDate ||
    search;
  const resetFilters = () => {
    setSearch('');
    setCandidateType('ALL');
    setStatus('ALL');
    setSyncStatus('ALL');
    setAssignedTo('ALL');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  // Per-row assignment handler — mutates a single enrollment's assigned_to.
  // Optimistic refresh strategy: clear spinner, refetch the list once the
  // PATCH resolves so the cell shows the freshly-resolved assignee email.
  const handleAssign = useCallback(async (enrollmentId, employeeId) => {
    setAssigningIds((prev) => new Set(prev).add(enrollmentId));
    try {
      await adminEmployeeService.assignEnrollment(enrollmentId, employeeId || null);
      toast.success(employeeId ? 'Lead assigned' : 'Lead unassigned');
      refetch();
    } catch (err) {
      toast.error(err?.message || 'Assignment failed');
    } finally {
      setAssigningIds((prev) => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  }, [refetch]);

  /* ── Page-change helpers ───────────────────────────────────────────── */
  // Any filter change must reset to page 1, otherwise the user may land on
  // an empty page (e.g. filter narrows total to 30, but they were on page 4).
  const onFilterChange = useCallback((setter) => (value) => {
    setter(value);
    setPage(1);
  }, []);

  /* ── Retry sync handler ────────────────────────────────────────────── */
  const handleRetrySync = async (id, displayName) => {
    setRetryingIds((prev) => new Set(prev).add(id));
    try {
      const result = await adminService.retrySyncEnrollment(id);
      setOptimisticSync((prev) => ({
        ...prev,
        [id]: result?.externalSyncStatus ?? 'PENDING',
      }));
      toast.success(`Retry queued for ${displayName || id}`);
    } catch (err) {
      toast.error(err?.message ?? 'Retry failed');
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        subtitle="One row per student — click the email or History to see all their enrollments"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        }
      />

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <Input
              label="Search"
              type="search"
              placeholder="Name, email, or phone (3+ chars)"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="w-44">
            <Select
              label="Candidate Type"
              value={candidateType}
              onChange={(e) => onFilterChange(setCandidateType)(e.target.value)}
            >
              <option value="ALL">All candidates</option>
              <option value="INTERNAL">Internal</option>
              <option value="EXTERNAL">External</option>
            </Select>
          </div>

          <div className="w-44">
            <Select
              label="Status"
              value={status}
              onChange={(e) => onFilterChange(setStatus)(e.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="payment_pending">Payment pending</option>
              <option value="paid">Paid</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>

          <div className="w-44">
            <Select
              label="Sync"
              value={syncStatus}
              onChange={(e) => onFilterChange(setSyncStatus)(e.target.value)}
            >
              <option value="ALL">All sync states</option>
              <option value="PENDING">Pending</option>
              <option value="SUCCESS">Synced</option>
              <option value="FAILED">Failed</option>
              <option value="DEAD_LETTER">Dead-letter</option>
            </Select>
          </div>

          <div className="w-48">
            <Select
              label="Assignee"
              value={assignedTo}
              onChange={(e) => onFilterChange(setAssignedTo)(e.target.value)}
            >
              <option value="ALL">All assignees</option>
              <option value="unassigned">Unassigned</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.email}</option>
              ))}
            </Select>
          </div>

          <div className="w-40">
            <Input
              label="From Date"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => onFilterChange(setFromDate)(e.target.value)}
            />
          </div>

          <div className="w-40">
            <Input
              label="To Date"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => onFilterChange(setToDate)(e.target.value)}
            />
          </div>

          {filtersActive && (
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          )}
        </div>
      </Card>

      {/* ── Error state ────────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error.message || 'Failed to load enrollments. Please retry.'}
        </div>
      )}

      {/* ── Table + pagination (one connected surface) ──────────────────
       *
       * Uses raw <table> + custom card wrapper instead of the shared
       * Card+Table components so the surface has exactly one overflow
       * boundary (the inner scroll wrapper) and no mystery min-height
       * propagation from nested abstractions. The card sizes strictly
       * to content — there is no empty space between the last row and
       * the pagination footer. */}
      <div
        className="bg-white rounded-xl border shadow-card overflow-hidden"
        style={{ borderColor: 'var(--admin-border, #E5E7EB)' }}
      >
        {/* Inner scroll wrapper.
         *
         * `display: flow-root` opens a fresh block-formatting context that
         * strictly contains its children — combined with `height: fit-content`
         * this guarantees the div is exactly as tall as the <table> inside it,
         * regardless of any stretching propagated from the parent flex layout.
         * Without these, some browsers leave a gap between the last table row
         * and the horizontal scrollbar at the bottom of the wrapper. */}
        <div
          style={{
            display: 'flow-root',
            height: 'fit-content',
            overflowX: 'auto',
            overflowY: 'hidden',
          }}
        >
          <table
            className="text-[13px] border-collapse"
            style={{ width: '100%', minWidth: '100%' }}
          >
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '1px solid var(--admin-border)' }}>
                {[
                  { key: 'sr',     label: '#',             align: 'right' },
                  { key: 'eid',    label: 'Enrollment ID' },
                  { key: 'name',   label: 'Name' },
                  { key: 'email',  label: 'Email' },
                  { key: 'phone',  label: 'Phone' },
                  { key: 'type',   label: 'Type' },
                  { key: 'plan',   label: 'Active Plan' },
                  { key: 'status', label: 'Status' },
                  { key: 'sync',   label: 'Sync' },
                  { key: 'assignee', label: 'Assignee' },
                  { key: 'created',label: 'Created' },
                  { key: 'act',    label: '' },
                ].map((h) => (
                  <Th key={h.key} align={h.align}>{h.label}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={COLS}>
                    <PageLoader label="Loading enrollments…" minH="min-h-[200px]" />
                  </td>
                </tr>
              )}

              {!loading && !error && items.length === 0 && (
                <EmptyState
                  colSpan={COLS}
                  icon={
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  }
                  title={filtersActive ? 'No enrollments match the current filters' : 'No enrollments yet'}
                  description={filtersActive
                    ? 'Try widening the date range, clearing the search, or switching candidate type.'
                    : 'New enrollments will appear here.'}
                />
              )}

              {!loading && !error && items.map((e, idx) => {
              // Stable cross-page serial number — preserves the user's
              // mental model when paginating through millions of records:
              // page 3 at limit 20 starts at row 41, not row 1.
              const srNo = (page - 1) * limit + idx + 1;
              const ctype = getCandidateType(e);
              const createdAt = e.createdAt ?? e.created_at;
              const syncFromServer = e.externalSyncStatus ?? null;
              const effSync = optimisticSync[e.id] ?? syncFromServer;
              const syncCfg = effSync ? SYNC_BADGE[effSync] : null;
              const canRetry = effSync === 'FAILED' || effSync === 'DEAD_LETTER';
              const isRetrying = retryingIds.has(e.id);
              return (
                <Tr key={e.id} striped={idx % 2 === 1}>
                  <Td align="right" className="text-slate-400 tabular-nums">
                    {srNo}
                  </Td>
                  <Td className="font-mono text-xs text-slate-500">
                    {e.enrollmentId ?? e.id}
                  </Td>
                  <Td className="text-slate-900 font-medium">
                    {e.fullName ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim()}
                  </Td>
                  <Td className="text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/students/${encodeURIComponent(e.email)}`)}
                        className="text-left hover:text-indigo-700 hover:underline truncate"
                        title="View all enrollments for this email"
                      >
                        {e.email}
                      </button>
                      {e.enrollmentCount > 1 && (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                          {e.enrollmentCount} enrollments
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td className="text-slate-600">{e.phone}</Td>
                  <Td>
                    <Badge variant={ctype === 'INTERNAL' ? 'info' : 'neutral'}>
                      {ctype === 'INTERNAL' ? 'Internal' : 'External'}
                    </Badge>
                  </Td>
                  {/* Active Plan — latest PAID plan's Plan ID + days left.
                      Shown for BOTH external and internal students: for internal
                      rows the Plan ID is the internal plan's externalPlanId
                      (from /admin/internal-plans); '—' when no paid plan yet. */}
                  <Td>
                    {e.activePlan?.externalPlanId ? (
                      <div>
                        <span className="font-mono text-[11px] text-slate-700">{e.activePlan.externalPlanId}</span>
                        {e.activePlan.daysLeft != null && (
                          <div className={`text-[11px] font-semibold ${
                            e.activePlan.daysLeft <= 0 ? 'text-red-600'
                            : e.activePlan.daysLeft <= 7 ? 'text-amber-600'
                            : 'text-emerald-600'
                          }`}>
                            {e.activePlan.daysLeft > 0 ? `${e.activePlan.daysLeft} day${e.activePlan.daysLeft === 1 ? '' : 's'} left` : 'Expired'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </Td>
                  <Td>
                    <Badge variant={enrollmentBadgeVariant(e.status)}>
                      {e.status ?? 'NEW'}
                    </Badge>
                  </Td>
                  <Td>
                    {syncCfg ? (
                      <SyncBadgeWithDiagnostics
                        status={effSync}
                        label={syncCfg.label}
                        variant={syncCfg.variant}
                        lastSync={e.lastSync}
                      />
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </Td>
                  <Td>
                    {/* Per-row assign control. UX rule: once a lead is
                        assigned, the "Unassigned" option disappears -
                        admin can REASSIGN to another employee but not
                        revert to unassigned. Tooltip explains on hover. */}
                    <select
                      value={e.assignedTo ?? ''}
                      disabled={assigningIds.has(e.id) || employees.length === 0}
                      onChange={(ev) => handleAssign(e.id, ev.target.value || null)}
                      className="text-xs border border-slate-200 bg-white rounded px-1.5 py-1 max-w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      title={
                        e.assignedTo
                          ? `Currently assigned to ${e.assignee?.email || 'unknown'}. Pick another employee to reassign.`
                          : 'Pick an employee to assign this lead.'
                      }
                    >
                      {/* Unassigned only when currently unassigned. */}
                      {!e.assignedTo && <option value="">Unassigned</option>}
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.email}</option>
                      ))}
                      {/* Fallback option if the current assignee isn't in the
                          loaded employees list (e.g. deactivated mid-page) —
                          keeps the dropdown's current value visible. */}
                      {e.assignedTo && !employees.some((emp) => emp.id === e.assignedTo) && (
                        <option value={e.assignedTo}>
                          {e.assignee?.email || 'Unknown employee'}
                        </option>
                      )}
                    </select>
                  </Td>
                  <Td className="text-slate-500 text-xs">
                    {createdAt ? new Date(createdAt).toLocaleString() : '—'}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/students/${encodeURIComponent(e.email)}`)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-700 transition-colors"
                        title="View this student's full enrollment history"
                      >
                        History
                      </button>
                      {canRetry && (
                        <button
                          type="button"
                          disabled={isRetrying}
                          onClick={() => handleRetrySync(
                            e.id,
                            e.fullName ?? e.email ?? e.enrollmentId,
                          )}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Re-queue the external-API sync for this enrollment"
                        >
                          {isRetrying ? <Loader size="xs" /> : 'Retry sync'}
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })}
            </tbody>
          </table>
        </div>

        {/* Pagination footer — only when there is data to paginate. */}
        {!loading && !error && total > 0 && (
          <div
            className="px-4 py-3 border-t bg-slate-50/40"
            style={{ borderColor: 'var(--admin-border, #E5E7EB)' }}
          >
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
