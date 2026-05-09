import { useState, useMemo } from 'react';
import { useFollowUps } from '../../hooks/useFollowUps';
import {
  PageHeader,
  Card,
  Badge,
  Table,
  Th,
  Td,
  Tr,
  Skeleton,
  EmptyState,
} from '../../components/admin';

/* ─── Status badge variant map ───────────────────────────────────────────── */
function followUpBadgeVariant(status) {
  const map = {
    NEW:             'info',
    CONTACTED:       'info',
    FOLLOW_UP:       'warning',
    CALLBACK:        'warning',
    PAYMENT_PENDING: 'warning',
    CONVERTED:       'success',
    NOT_INTERESTED:  'neutral',
    CLOSED:          'neutral',
  };
  return map[status] ?? 'neutral';
}

const STATUS_FILTERS = ['', 'NEW', 'CONTACTED', 'FOLLOW_UP', 'CALLBACK', 'CONVERTED', 'CLOSED'];

/* ─── Skeleton rows ──────────────────────────────────────────────────────── */
const HEADER_COLS = ['Enrollment', 'Name', 'Email', 'Phone', 'Status', 'Priority', 'Calls', 'Next follow-up', 'Last contact'];
const COL_COUNT = HEADER_COLS.length;

function SkeletonRows({ count = 7 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Tr key={i} striped={i % 2 === 1}>
          <Td><Skeleton w="w-20" /></Td>
          <Td><Skeleton w="w-28" /></Td>
          <Td><Skeleton w="w-36" /></Td>
          <Td><Skeleton w="w-20" /></Td>
          <Td><Skeleton w="w-16" /></Td>
          <Td><Skeleton w="w-12" /></Td>
          <Td><Skeleton w="w-6" /></Td>
          <Td><Skeleton w="w-24" /></Td>
          <Td><Skeleton w="w-24" /></Td>
        </Tr>
      ))}
    </>
  );
}

export default function FollowUps() {
  const [status, setStatus] = useState('');
  const [page, setPage]     = useState(1);
  const filters = useMemo(
    () => ({ page, limit: 20, status: status || undefined }),
    [page, status],
  );
  const { data, loading, error } = useFollowUps(filters);

  const items = data?.items ?? data?.data ?? data ?? [];
  const total = data?.total ?? data?.pagination?.total ?? items.length;
  const hasNext = items.length === 20;

  const switchStatus = (s) => { setStatus(s); setPage(1); };

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

      {/* ── Status filter pills ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => switchStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
              status === s
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
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
