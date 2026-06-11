import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useFollowUps } from '../../hooks/useFollowUps';
import { adminEmployeeService } from '../../services/adminEmployeeService';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Select,
  Table,
  Th,
  Td,
  Tr,
  PageLoader,
  EmptyState,
} from '../../components/admin';

/* ─── Status badge variant map ───────────────────────────────────────────── */
// Keyed on UPPERCASE so it stays compatible with rows already arriving as
// `NEW` / `CONTACTED` etc. (the backend uppercases on output). New enum
// values (FOLLOWUP_SCHEDULED, CONVERTED, LOST, etc.) added in Phase 1 are
// included so badges colour correctly.
function followUpBadgeVariant(status) {
  const map = {
    NEW:                 'info',
    CONTACTED:           'info',
    FOLLOWUP_SCHEDULED:  'warning',
    CALL_BACK_LATER:     'warning',
    INTERESTED:          'success',
    PAYMENT_PENDING:     'warning',
    PAYMENT_COMPLETED:   'success',
    CONVERTED:           'success',
    NOT_INTERESTED:      'neutral',
    NO_RESPONSE:         'warning',
    INVALID_NUMBER:      'danger',
    LOST:                'danger',
    CLOSED:              'neutral',
    FOLLOWUP_CLOSED:     'neutral',
  };
  return map[status] ?? 'neutral';
}

// Status pills. Each pill is { label, value, openOnly? } where:
//   - value     : DB enum value (lowercased to match backend) OR '' for
//                 the wildcard pill (OPEN / ALL — see openOnly below).
//   - openOnly  : when true, the backend filter sends openOnly=true so
//                 terminal statuses are hidden; when false / undefined,
//                 the empty value means "no status filter, show
//                 everything including terminals".
//
// Default selection is OPEN — actionable leads only. The terminal pills
// (PAYMENT COMPLETED / CONVERTED / LOST / CLOSED) sit at the tail; ALL
// at the very end shows everything for audit/lookback.
// Statuses that are out of scope for the Follow-Ups module entirely
// (per product decision). Historical rows with these statuses still
// exist in the DB for audit but are never shown on this page — every
// pill below sends this as excludeStatuses so they cannot leak through
// even the ALL view.
const HIDDEN_STATUSES = 'payment_completed,lost';

// Status pills aligned to the simplified employee status set so admin +
// employee views agree on terminology. Historical rows whose status
// doesn't map to any of these (call_back_later, payment_pending,
// followup_scheduled, invalid_number, no_response) remain reachable via
// the ALL pill but no longer get their own dedicated pill.
const STATUS_FILTERS = [
  { key: 'open',     value: '',               label: 'OPEN',                  openOnly: true  },
  { key: 'new',      value: 'new',            label: 'NEW'                                    },
  { key: 'cont',     value: 'contacted',      label: 'FOLLOW-UP IN PROGRESS'                  },
  { key: 'int',      value: 'interested',     label: 'INTERESTED'                             },
  { key: 'ni',       value: 'not_interested', label: 'NOT INTERESTED'                         },
  { key: 'conv',     value: 'converted',      label: 'CONVERTED'                              },
  { key: 'closed',   value: 'closed',         label: 'CLOSED'                                 },
  { key: 'all',      value: '',               label: 'ALL',                   openOnly: false },
];

// Default: OPEN. Stored as the pill's `key` so the two wildcard pills
// (OPEN + ALL) can co-exist without colliding on an empty value.
const DEFAULT_PILL_KEY = 'open';

/* ─── Column count ───────────────────────────────────────────────────────── */
const HEADER_COLS = [
  'Sr No', 'Enrollment', 'Name', 'Email', 'Phone', 'Type', 'Description', 'Status', 'Assignee',
  'Next follow-up', 'Last contact',
];
const COL_COUNT = HEADER_COLS.length;

export default function FollowUps() {
  // Pill state — track which preset pill is selected (by its key) rather
  // than just the raw status value. This lets OPEN and ALL coexist even
  // though both send the empty status — they differ only in openOnly.
  const [pillKey, setPillKey]       = useState(DEFAULT_PILL_KEY);
  const [page, setPage]             = useState(1);
  // Lead-ownership filter — 'ALL' (default), 'unassigned', 'me', or employee UUID.
  const [assignedTo, setAssignedTo] = useState('ALL');
  const [employees, setEmployees]   = useState([]);
  const [reassigningIds, setReassigningIds] = useState(new Set());
  const [reloadKey, setReloadKey]   = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  // Resolve the currently-selected pill's value + openOnly. Fall back to
  // the default if state ever drifts to an unknown key (defensive — set-
  // ters always pass valid keys).
  const selectedPill = useMemo(
    () => STATUS_FILTERS.find((s) => s.key === pillKey) ?? STATUS_FILTERS[0],
    [pillKey],
  );

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      ...(selectedPill.value     ? { status:   selectedPill.value }     : {}),
      ...(selectedPill.openOnly  ? { openOnly: true }                   : {}),
      // HIDDEN_STATUSES sit out of scope for this module entirely. The
      // backend honours excludeStatuses only when no explicit status /
      // openOnly is set, so this only takes effect on the ALL pill —
      // which is exactly when it's needed.
      ...(!selectedPill.value && !selectedPill.openOnly
        ? { excludeStatuses: HIDDEN_STATUSES }
        : {}),
      ...(assignedTo !== 'ALL'   ? { assignedTo }                       : {}),
      _reloadKey: reloadKey, // changing this forces useFollowUps to refetch
    }),
    [page, selectedPill, assignedTo, reloadKey],
  );
  const { data, loading, error } = useFollowUps(filters);

  const items = data?.items ?? data?.data ?? data ?? [];
  const total = data?.total ?? data?.pagination?.total ?? items.length;
  const hasNext = items.length === 20;

  const switchPill = (key) => { setPillKey(key); setPage(1); };

  const resetFilters = () => { setAssignedTo('ALL'); setPage(1); };

  // Load employees for the assignee filter + per-row reassign dropdowns.
  useEffect(() => {
    let cancelled = false;
    adminEmployeeService.list({ activeOnly: true, limit: 500 })
      .then((res) => { if (!cancelled) setEmployees(res?.rows ?? []); })
      .catch(() => { /* fail-soft; dropdowns just stay empty */ });
    return () => { cancelled = true; };
  }, []);

  // Per-row reassign handler. The followup's underlying enrollment is the
  // unit of assignment — assigning the lead moves both the enrollment and
  // any future followups that derive from it. Existing followups retain
  // their old followup.assigned_to until manually updated; we treat the
  // enrollment-level assignment as the source of truth going forward.
  const handleReassign = useCallback(async (followup, newEmployeeId) => {
    const enrollmentId = followup.enrollment?.id || followup.enrollmentId;
    if (!enrollmentId) {
      toast.error('Cannot reassign — enrollment id missing');
      return;
    }
    setReassigningIds((prev) => new Set(prev).add(followup.id));
    try {
      // Reuse the enrollment-level assignment API. Phase 1 introduced
      // Enrollment.assigned_to as the authoritative ownership column.
      await adminEmployeeService.assignEnrollment(enrollmentId, newEmployeeId || null);
      toast.success(newEmployeeId ? 'Lead reassigned' : 'Lead unassigned');
      refetch();
    } catch (err) {
      toast.error(err?.message || 'Reassignment failed');
    } finally {
      setReassigningIds((prev) => {
        const next = new Set(prev);
        next.delete(followup.id);
        return next;
      });
    }
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="Follow-ups"
        subtitle="Track and manage outreach activities"
        action={
          <span className="text-sm text-slate-500">{total} total</span>
        }
      />

      {/* ── Status filter pills + Assignee filter ─────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => switchPill(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
                pillKey === s.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="w-56">
          <Select
            label="Assignee"
            value={assignedTo}
            onChange={(e) => { setAssignedTo(e.target.value); setPage(1); }}
          >
            <option value="ALL">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.email}</option>
            ))}
          </Select>
        </div>
        <Button variant="secondary" onClick={resetFilters}>Reset</Button>
      </div>

      {/* ── Error state ──────────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error.message}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <Card variant="flush">
        <Table>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {HEADER_COLS.map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={COL_COUNT}>
                  <PageLoader label="Loading follow-ups…" minH="min-h-[200px]" />
                </td>
              </tr>
            )}

            {!loading && !error && items.length === 0 && (
              <EmptyState
                colSpan={COL_COUNT}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.5 10.5a11.037 11.037 0 004.999 5l1.113-1.724a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
                title={!!status || page > 1 ? 'No follow-ups match the current filter' : 'No follow-ups yet'}
                description={!!status || page > 1 ? 'Try a different status filter.' : 'Follow-ups will appear here as enrollments are processed.'}
              />
            )}

            {!loading && !error && items.map((f, idx) => (
              <Tr key={f.id} striped={idx % 2 === 1}>
                <Td className="text-slate-500 text-sm font-mono">{(page - 1) * 20 + idx + 1}</Td>
                <Td className="font-mono text-xs text-slate-500">
                  {f.enrollment?.enrollmentId ?? f.enrollmentId ?? '—'}
                </Td>
                <Td className="text-slate-900 font-medium">
                  {f.enrollment?.fullName ?? '—'}
                </Td>
                <Td className="text-slate-600">
                  {f.enrollment?.email ?? '—'}
                </Td>
                <Td className="text-slate-600">
                  {f.enrollment?.phone ?? '—'}
                </Td>
                <Td>
                  <Badge variant={f.type === 'website' ? 'info' : 'neutral'}>
                    {f.type === 'website' ? 'Website' : 'Enrollment'}
                  </Badge>
                </Td>
                <Td className="text-slate-600 text-sm align-top whitespace-normal w-[260px] max-w-[260px]">
                  {f.description
                    ? <span className="block line-clamp-2 whitespace-normal break-words" title={f.description}>{f.description}</span>
                    : <span className="text-slate-300">—</span>}
                </Td>
                <Td>
                  <Badge variant={followUpBadgeVariant(f.status)}>
                    {f.status}
                  </Badge>
                </Td>
                <Td>
                  {/* Reassign select. UX rule: once a lead has an
                      assignee, admin can REASSIGN to another employee
                      but cannot unassign. The "Unassigned" option only
                      appears for currently-unassigned rows.
                      Tooltip explains the behaviour on hover. */}
                  <select
                    value={f.assignedTo ?? ''}
                    disabled={reassigningIds.has(f.id) || employees.length === 0}
                    onChange={(ev) => handleReassign(f, ev.target.value || null)}
                    className="text-xs border border-slate-200 bg-white rounded px-1.5 py-1 max-w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    title={
                      f.assignedTo
                        ? `Currently assigned to ${f.assignee?.email || 'unknown'}. Pick another employee to reassign.`
                        : 'Pick an employee to assign this lead.'
                    }
                  >
                    {/* Unassigned option ONLY for currently-unassigned rows. */}
                    {!f.assignedTo && <option value="">Unassigned</option>}
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.email}</option>
                    ))}
                    {/* Keep the current assignee visible even if they're not
                        in the loaded list (deactivated, role changed, etc.). */}
                    {f.assignedTo && !employees.some((emp) => emp.id === f.assignedTo) && (
                      <option value={f.assignedTo}>
                        {f.assignee?.email || 'Unknown employee'}
                      </option>
                    )}
                  </select>
                </Td>
                <Td className="text-slate-500 text-xs">
                  {f.nextFollowUpAt ? new Date(f.nextFollowUpAt).toLocaleString() : '—'}
                </Td>
                <Td className="text-slate-500 text-xs">
                  {f.lastContactAt ? new Date(f.lastContactAt).toLocaleString() : '—'}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 pb-2">
        <div>{total} total</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors duration-200"
          >
            Prev
          </button>
          <span className="px-3 py-1.5 text-slate-600">Page {page}</span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors duration-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
