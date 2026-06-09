import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useFollowUps } from '../../hooks/useFollowUps';
import { adminEmployeeService } from '../../services/adminEmployeeService';
import {
  PageHeader,
  Card,
  Badge,
  Select,
  Table,
  Th,
  Td,
  Tr,
  Skeleton,
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

// Status pills. Each pill is { label, value } where value is the DB enum
// value (the backend lowercases incoming query params before filtering, so
// we send the enum's canonical lowercase form). Previous pills like
// FOLLOW_UP / CALLBACK didn't map to any DB enum value, which is why the
// admin Follow-Ups page surfaced "Invalid data" when those pills were
// clicked — Prisma rejected the unknown enum value.
const STATUS_FILTERS = [
  { value: '',                   label: 'All' },
  { value: 'new',                label: 'NEW' },
  { value: 'contacted',          label: 'CONTACTED' },
  { value: 'followup_scheduled', label: 'FOLLOW-UP' },
  { value: 'call_back_later',    label: 'CALLBACK' },
  { value: 'interested',         label: 'INTERESTED' },
  { value: 'payment_pending',    label: 'PAYMENT PENDING' },
  { value: 'converted',          label: 'CONVERTED' },
  { value: 'lost',               label: 'LOST' },
  { value: 'closed',             label: 'CLOSED' },
];

/* ─── Skeleton rows ──────────────────────────────────────────────────────── */
const HEADER_COLS = [
  'Enrollment', 'Name', 'Email', 'Phone', 'Status', 'Assignee',
  'Priority', 'Calls', 'Next follow-up', 'Last contact',
];
const COL_COUNT = HEADER_COLS.length;

function SkeletonRows({ count = 7 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Tr key={i} striped={i % 2 === 1}>
          {Array.from({ length: COL_COUNT }).map((__, j) => (
            <Td key={j}><Skeleton w="w-20" /></Td>
          ))}
        </Tr>
      ))}
    </>
  );
}

export default function FollowUps() {
  const [status, setStatus]         = useState('');
  const [page, setPage]             = useState(1);
  // Lead-ownership filter — 'ALL' (default), 'unassigned', 'me', or employee UUID.
  const [assignedTo, setAssignedTo] = useState('ALL');
  const [employees, setEmployees]   = useState([]);
  const [reassigningIds, setReassigningIds] = useState(new Set());
  const [reloadKey, setReloadKey]   = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      status: status || undefined,
      ...(assignedTo !== 'ALL' ? { assignedTo } : {}),
      _reloadKey: reloadKey, // changing this forces useFollowUps to refetch
    }),
    [page, status, assignedTo, reloadKey],
  );
  const { data, loading, error } = useFollowUps(filters);

  const items = data?.items ?? data?.data ?? data ?? [];
  const total = data?.total ?? data?.pagination?.total ?? items.length;
  const hasNext = items.length === 20;

  const switchStatus = (s) => { setStatus(s); setPage(1); };

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
              key={s.value || 'all'}
              type="button"
              onClick={() => switchStatus(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
                status === s.value
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
            {loading && <SkeletonRows />}

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
                  <Badge variant={followUpBadgeVariant(f.status)}>
                    {f.status}
                  </Badge>
                </Td>
                <Td>
                  {/* Reassign select — writes to the underlying enrollment's
                      assigned_to via the assignment API. Visible to admins
                      only; permission gate enforced server-side. */}
                  <select
                    value={f.assignedTo ?? ''}
                    disabled={reassigningIds.has(f.id) || employees.length === 0}
                    onChange={(ev) => handleReassign(f, ev.target.value || null)}
                    className="text-xs border border-slate-200 bg-white rounded px-1.5 py-1 max-w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    title={f.assignee?.email || 'Unassigned'}
                  >
                    <option value="">Unassigned</option>
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
                <Td className="text-slate-600">
                  {f.priority ?? '—'}
                </Td>
                <Td className="text-slate-600">
                  {f.callAttempts ?? 0}
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
