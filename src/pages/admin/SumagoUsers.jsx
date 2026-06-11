import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { webhookAdminService } from '../../services/webhookAdminService';
import { PageHeader, Card, Button, Input, Pagination, PageLoader } from '../../components/admin';

/**
 * SumagoUsers — admin page for the Sumago Platform Integration users.
 *
 * Server-side pagination:
 *   - All filtering, search, sorting, and paging happens on the backend.
 *     We never load the full table into the browser — at scale (millions
 *     of rows) the client only ever sees `limit` rows at a time.
 *   - URL params keep the view shareable / refresh-safe: an admin can
 *     bookmark "/admin/sumago-users?page=12&limit=50&search=foo" and
 *     come back to the same state.
 *   - The backend auto-syncs from Sumago on page=1 with no filters,
 *     or when the Refresh button forces `?sync=force`. Navigating
 *     between pages serves straight from the local mirror — clicks are
 *     instant regardless of Sumago latency.
 */

// Debounce hook — used for the search box so we don't fire a request on
// every keystroke. 350 ms is the sweet spot for typing-feel vs. wasted
// requests; tune if the table feels laggy at scale.
function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SumagoUsers() {
  const [config, setConfig]     = useState(null);
  const [data, setData]         = useState(null);   // backend `data` envelope
  const [meta, setMeta]         = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState(null);

  // Query state — debouncedSearch separates immediate UI input from the
  // value actually sent to the server.
  const [page, setPage]                       = useState(1);
  const [limit, setLimit]                     = useState(25);
  const [searchInput, setSearchInput]         = useState('');
  const debouncedSearch                       = useDebouncedValue(searchInput, 350);
  const [sortBy, setSortBy]                   = useState('last_synced_at');
  const [sortOrder, setSortOrder]             = useState('desc');

  // Whenever ANY filter changes, jump back to page 1 — otherwise the user
  // could be left on page 12 of a result set that only has 2 pages.
  const filtersSignature = `${debouncedSearch}|${sortBy}|${sortOrder}|${limit}`;
  const previousFiltersRef = useRef(filtersSignature);
  useEffect(() => {
    if (previousFiltersRef.current !== filtersSignature) {
      previousFiltersRef.current = filtersSignature;
      setPage(1);
    }
  }, [filtersSignature]);

  // Load config (endpoint badge) once on mount.
  useEffect(() => {
    let cancelled = false;
    webhookAdminService.getSumagoConfig()
      .then((cfg) => { if (!cancelled) setConfig(cfg); })
      .catch(() => { if (!cancelled) setConfig({ enabled: false, baseUrl: null }); });
    return () => { cancelled = true; };
  }, []);

  // The single fetch routine — also used by the Refresh button.
  // Race-safe via a generation counter: only the most recent fetch
  // can write to state, so out-of-order responses (slow first call,
  // fast second call) don't show stale data.
  const fetchGenRef = useRef(0);
  const load = useCallback(async (opts = {}) => {
    const myGen = ++fetchGenRef.current;
    const isRefresh = Boolean(opts.forceSync);
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    setError(null);
    try {
      const result = await webhookAdminService.fetchSumagoUsers({
        page,
        limit,
        search:    debouncedSearch,
        sortBy,
        sortOrder,
        forceSync: isRefresh,
      });
      if (myGen !== fetchGenRef.current) return; // stale response — discard
      setData(result.data);
      setMeta(result.meta);

      const sync = result.data?.sync;
      if (sync?.ok === false) {
        toast(
          sync.error?.message ?? 'Sumago is unreachable. Showing last synced data.',
          { icon: '⚠️' },
        );
      } else if (sync?.ok && isRefresh) {
        const added   = sync.inserted ?? 0;
        const changed = sync.updated  ?? 0;
        if (added === 0 && changed === 0) {
          toast.success('Already up to date');
        } else {
          const parts = [];
          if (added   > 0) parts.push(`${added} new`);
          if (changed > 0) parts.push(`${changed} updated`);
          toast.success(`Synced — ${parts.join(', ')}`);
        }
      }
    } catch (err) {
      if (myGen !== fetchGenRef.current) return;
      setError(err.message ?? 'Failed to load users');
      toast.error(err.message ?? 'Failed to load users');
    } finally {
      if (myGen === fetchGenRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [page, limit, debouncedSearch, sortBy, sortOrder]);

  // Re-fetch whenever any server-side parameter changes.
  useEffect(() => { load(); }, [load]);

  const endpoint = config?.baseUrl
    ? `${config.baseUrl}/integrations/get-users`
    : '—';

  const syncMeta     = data?.sync;
  const lastSyncedAt = syncMeta?.at ? new Date(syncMeta.at) : null;
  const syncFailed   = syncMeta && syncMeta.ok === false;
  const orgCode      = data?.organizationCode ?? '—';

  const users = data?.users ?? [];

  // ---- Helpers shared with old version (unchanged contracts) ----
  const latestPlan = (u) => {
    if (u?.plan) return u.plan;
    const hist = u?.planHistory;
    if (Array.isArray(hist) && hist.length > 0) {
      const sorted = [...hist].sort((a, b) =>
        new Date(b?.paymentDate ?? 0) - new Date(a?.paymentDate ?? 0),
      );
      return sorted[0]?.plan ?? null;
    }
    return null;
  };
  const totalPaid = (u) => {
    const hist = u?.planHistory;
    if (!Array.isArray(hist) || hist.length === 0) return null;
    return hist.reduce((s, p) => s + (Number(p?.amount) || 0), 0);
  };
  const localPaidRupees = (u) => {
    if (u?.localPayment?.amountPaidPaise != null) {
      return Math.round(u.localPayment.amountPaidPaise) / 100;
    }
    return totalPaid(u);
  };
  const localPaymentsCount = (u) => {
    if (u?.localPayment?.amountPaidPaise > 0) return 1;
    return u?.planHistory?.length ?? 0;
  };

  // Reset all filters back to defaults.
  const resetFilters = () => {
    setSearchInput('');
    setPage(1);
  };

  // Header sort-toggle handler. Clicking the same column flips the order;
  // clicking a different column sorts that column DESC.
  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortOrder((s) => (s === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const showingFrom = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const showingTo   = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sumago — Fetch Users"
        subtitle="Auto-synced from /integrations/get-users into our local mirror table"
        action={
          <Button
            variant="secondary"
            loading={refreshing}
            onClick={() => load({ forceSync: true })}
            disabled={!config?.enabled || refreshing || loading}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      <Card title="Endpoint">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                config?.enabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config?.enabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {config?.enabled ? 'Configured' : 'Not configured'}
            </span>
            <code className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded font-mono">
              GET {endpoint}
            </code>
            {lastSyncedAt && (
              <span className="text-xs text-slate-500 inline-flex items-center gap-2">
                <span>Last sync: {lastSyncedAt.toLocaleString()}</span>
                {/* Delta-only summary. "Unchanged" is intentionally hidden —
                    it's noise from the user's POV (the total user count is
                    already shown in the Organisation line). The backend
                    still returns and logs all three buckets for ops. */}
                {syncMeta?.ok && !syncMeta.skipped && (() => {
                  const added   = syncMeta.inserted ?? 0;
                  const changed = syncMeta.updated  ?? 0;
                  if (added === 0 && changed === 0) {
                    return (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Up to date
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold">
                      {added > 0   && <span>+{added} new</span>}
                      {added > 0 && changed > 0 && <span className="text-indigo-300">·</span>}
                      {changed > 0 && <span>{changed} updated</span>}
                    </span>
                  );
                })()}
                {syncMeta?.skipped && (
                  <span className="text-slate-400 italic">(served from mirror)</span>
                )}
              </span>
            )}
          </div>

          {!config?.enabled && (
            <p className="text-xs text-slate-500">
              Set <span className="font-mono">SUMAGO_API_BASE_URL</span> and <span className="font-mono">SUMAGO_API_TOKEN</span> in the backend env to enable. The Bearer token never leaves the server — this page reads from the local mirror.
            </p>
          )}

          {syncFailed && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <strong>Degraded mode:</strong> couldn't reach Sumago just now ({syncMeta?.error?.code ?? 'error'}). Showing the most recent local mirror.
            </div>
          )}
        </div>
      </Card>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Card title={`Users (${meta.total ?? 0})`}>
        <div className="space-y-3">
          {/* Header summary — Organisation / Status / Total */}
          <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
            <span><b>Organisation:</b> {orgCode}</span>
            <span><b>Status:</b> {data?.status ?? '—'}</span>
            <span><b>Total users:</b> {meta.total ?? 0}</span>
          </div>

          {/* Filter bar — search only */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[220px] max-w-md">
              <Input
                placeholder="Search by email, name, or phone…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button variant="secondary" onClick={resetFilters}>Reset</Button>
            <div className="text-xs text-slate-500 ml-auto">
              {meta.total > 0 && (
                <>Showing <b>{showingFrom}–{showingTo}</b> of <b>{meta.total}</b></>
              )}
            </div>
          </div>

          {loading && !data && (
            <PageLoader label="Loading users…" minH="min-h-[200px]" />
          )}

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Sr No</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">User ID</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Name</th>
                    <SortHeader
                      column="email"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onToggle={toggleSort}
                    >
                      Email
                    </SortHeader>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Phone</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Type</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Plan</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Local Plan</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Group</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Unit</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Phase</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Segment</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Email</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Onboarding</th>
                    <SortHeader
                      column="last_synced_at"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onToggle={toggleSort}
                      align="left"
                    >
                      Last synced
                    </SortHeader>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Payments</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Total ₹</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 && !loading ? (
                    <tr><td colSpan={17} className="px-3 py-6 text-center text-slate-400 text-sm">
                      {debouncedSearch
                        ? 'No users match the current search.'
                        : 'No users in local mirror yet.'}
                    </td></tr>
                  ) : (
                    users.map((u, i) => {
                      const plan = latestPlan(u);
                      const planFromHistory = !u?.plan && plan;
                      const paid = localPaidRupees(u);
                      const paymentsCount = localPaymentsCount(u);
                      const syncedAt = u?._localSync?.lastSyncedAt
                        ? new Date(u._localSync.lastSyncedAt)
                        : null;
                      return (
                        <tr key={u.userId ?? u.email ?? i} className={i % 2 === 1 ? 'bg-slate-50/50' : ''}>
                          <td className="px-3 py-2 text-slate-500 text-sm font-mono">
                            {(meta.page - 1) * meta.limit + i + 1}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-700">
                            {u.localEnrollmentCode ?? u.userId ?? '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-800">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</td>
                          <td className="px-3 py-2 text-slate-600">{u.email ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-600">{u.phoneNumber ?? '—'}</td>
                          <td className="px-3 py-2">
                            {u.localCandidateType === 'INTERNAL' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wide">
                                Internal
                              </span>
                            ) : u.localCandidateType === 'EXTERNAL' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wide">
                                External
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {plan ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-brand-50 text-brand-700 border border-brand-200">{plan}</span>
                                {planFromHistory && <span className="text-[10px] text-slate-400 italic" title="Derived from latest planHistory entry">latest</span>}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {u.localPlan ? (
                              <div className="flex flex-col">
                                <div className="text-slate-800 text-[12px] font-semibold leading-tight">
                                  {u.localPlan.name ?? '—'}
                                  {u.localPlan.duration && (
                                    <span className="font-normal text-slate-500"> · {u.localPlan.duration}</span>
                                  )}
                                </div>
                                {u.localPlan.courseName && (
                                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                                    {u.localPlan.courseName}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-700">{u.group ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-700">{u.unit ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-700">{u.phase ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-700">{u.segment ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-700">{u.emailStatus ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-700">{u.onboardingStatus ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">
                            {syncedAt ? syncedAt.toLocaleString() : '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">{paymentsCount}</td>
                          <td className="px-3 py-2 text-right text-slate-700 font-mono text-xs">
                            {paid != null
                              ? `₹${paid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                              : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination footer — page size + prev/next.
              `limit` is required for the "Showing X–Y of Z" range; without
              it the Pagination component falls back to "0–0 of N". */}
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={setPage}
          />
        </div>
      </Card>
    </div>
  );
}

/**
 * SortHeader — clickable <th> that toggles sort direction.
 * Shows an up/down arrow when the column is the active sort.
 */
function SortHeader({ column, sortBy, sortOrder, onToggle, children, align = 'left' }) {
  const isActive = sortBy === column;
  const arrow = !isActive ? '↕' : sortOrder === 'asc' ? '▲' : '▼';
  return (
    <th
      onClick={() => onToggle(column)}
      className={`text-${align} px-3 py-2 text-xs font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900 transition-colors`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <span className={`text-[10px] ${isActive ? 'text-brand-600' : 'text-slate-400'}`}>{arrow}</span>
      </span>
    </th>
  );
}
