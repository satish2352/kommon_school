import { useState, useMemo } from 'react';
import { useAdminEnrollments } from '../../hooks/useAdmin';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Select,
  Table,
  Th,
  Td,
  Tr,
  Skeleton,
  EmptyState,
} from '../../components/admin';

/* ─── Source detection ───────────────────────────────────────────────────────
 *
 * "Internal" candidates are created through the admin manual flow against an
 * Internal Plan — so the enrollment record carries `internalPlanId` /
 * `internalPlanRefId` (or the snake_case equivalents).
 *
 * "External" candidates come from the public website flow (PaymentFlow /
 * EnrollModal) and lack those fields.
 *
 * Used as a client-side fallback when the backend has not yet implemented the
 * `source` / `candidateType` query parameter.
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

/* ─── Status badge variant map ───────────────────────────────────────────── */
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

/* ─── Skeleton rows ──────────────────────────────────────────────────────── */
const COLS = 7;

function SkeletonRows({ count = 7 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Tr key={i} striped={i % 2 === 1}>
          <Td><Skeleton w="w-24" /></Td>
          <Td><Skeleton w="w-28" /></Td>
          <Td><Skeleton w="w-36" /></Td>
          <Td><Skeleton w="w-20" /></Td>
          <Td><Skeleton w="w-16" /></Td>
          <Td><Skeleton w="w-12" /></Td>
          <Td><Skeleton w="w-24" /></Td>
        </Tr>
      ))}
    </>
  );
}

export default function Enrollments() {
  const [page, setPage] = useState(1);

  /* ── Filter state ── */
  const [candidateType, setCandidateType] = useState('ALL');
  const [fromDate, setFromDate]           = useState('');
  const [toDate, setToDate]               = useState('');

  /* ── Reset filters helper ── */
  const filtersActive = candidateType !== 'ALL' || fromDate || toDate;
  const resetFilters = () => {
    setCandidateType('ALL');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const filters = useMemo(() => ({
    page,
    limit: 20,
    ...(candidateType !== 'ALL' ? { candidateType, source: candidateType } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate   ? { toDate }   : {}),
  }), [page, candidateType, fromDate, toDate]);
  const { data, loading, error } = useAdminEnrollments(filters);

  const rawItems = data?.items ?? data?.data ?? data ?? [];

  /* ── Client-side fallback filter ─────────────────────────────────────────
   * Applied on top of the server response in case the backend does not yet
   * honour `candidateType` / `fromDate` / `toDate`. Safe no-op when the
   * backend already filtered.
   */
  const items = useMemo(() => {
    return rawItems.filter((e) => {
      if (candidateType !== 'ALL' && getCandidateType(e) !== candidateType) return false;
      const created = e.createdAt ?? e.created_at;
      if (fromDate && created && new Date(created) < new Date(fromDate))                    return false;
      if (toDate   && created && new Date(created) >  new Date(`${toDate}T23:59:59.999`)) return false;
      return true;
    });
  }, [rawItems, candidateType, fromDate, toDate]);

  const total   = data?.total ?? data?.pagination?.total ?? items.length;
  const hasNext = rawItems.length === 20;

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="Enrollments"
        subtitle="Manage and review student enrollments"
        action={
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 mr-2">{total} total</span>
          </div>
        }
      />

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <Select
              label="Candidate Type"
              value={candidateType}
              onChange={(e) => { setCandidateType(e.target.value); setPage(1); }}
            >
              <option value="ALL">All candidates</option>
              <option value="INTERNAL">Internal</option>
              <option value="EXTERNAL">External</option>
            </Select>
          </div>

          <div className="w-44">
            <Input
              label="From Date"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            />
          </div>

          <div className="w-44">
            <Input
              label="To Date"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            />
          </div>

          {filtersActive && (
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          )}
        </div>
      </Card>

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
              {['Enrollment ID', 'Name', 'Email', 'Phone', 'Type', 'Status', 'Created'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <SkeletonRows />}

            {!loading && !error && items.length === 0 && (
              <EmptyState
                colSpan={COLS}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5m6 0v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 0H9" />
                  </svg>
                }
                title={filtersActive || page > 1 ? 'No enrollments match the current filters' : 'No enrollments yet'}
                description={filtersActive
                  ? 'Try widening the date range or switching candidate type.'
                  : page > 1
                  ? 'Try adjusting your search or page.'
                  : 'New enrollments will appear here.'}
              />
            )}

            {!loading && !error && items.map((e, idx) => {
              const ctype = getCandidateType(e);
              const createdAt = e.createdAt ?? e.created_at;
              return (
                <Tr key={e.id} striped={idx % 2 === 1}>
                  <Td className="font-mono text-xs text-slate-500">
                    {e.enrollmentId ?? e.id}
                  </Td>
                  <Td className="text-slate-900 font-medium">
                    {e.fullName ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim()}
                  </Td>
                  <Td className="text-slate-600">{e.email}</Td>
                  <Td className="text-slate-600">{e.phone}</Td>
                  <Td>
                    <Badge variant={ctype === 'INTERNAL' ? 'info' : 'neutral'}>
                      {ctype === 'INTERNAL' ? 'Internal' : 'External'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge variant={enrollmentBadgeVariant(e.status)}>
                      {e.status ?? 'NEW'}
                    </Badge>
                  </Td>
                  <Td className="text-slate-500 text-xs">
                    {createdAt ? new Date(createdAt).toLocaleString() : '—'}
                  </Td>
                </Tr>
              );
            })}
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
