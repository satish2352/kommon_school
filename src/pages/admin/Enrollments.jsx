import { useState, useMemo } from 'react';
import { useAdminEnrollments } from '../../hooks/useAdmin';
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
const COLS = 6;

function SkeletonRows({ count = 7 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Tr key={i} striped={i % 2 === 1}>
          <Td><Skeleton w="w-24" /></Td>
          <Td><Skeleton w="w-28" /></Td>
          <Td><Skeleton w="w-36" /></Td>
          <Td><Skeleton w="w-20" /></Td>
          <Td><Skeleton w="w-12" /></Td>
          <Td><Skeleton w="w-24" /></Td>
        </Tr>
      ))}
    </>
  );
}

export default function Enrollments() {
  const [page, setPage] = useState(1);
  const filters = useMemo(() => ({ page, limit: 20 }), [page]);
  const { data, loading, error } = useAdminEnrollments(filters);

  const items = data?.items ?? data?.data ?? data ?? [];
  const total = data?.total ?? data?.pagination?.total ?? items.length;
  const hasNext = items.length === 20;

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="Enrollments"
        subtitle="Manage and review student enrollments"
        action={
          <span className="text-sm text-slate-500">{total} total</span>
        }
      />

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
              {['Enrollment ID', 'Name', 'Email', 'Phone', 'Status', 'Created'].map((h) => (
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
                title={page > 1 ? 'No enrollments match the current filter' : 'No enrollments yet'}
                description={page > 1 ? 'Try adjusting your search or page.' : 'New enrollments will appear here.'}
              />
            )}

            {!loading && !error && items.map((e, idx) => (
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
                  <Badge variant={enrollmentBadgeVariant(e.status)}>
                    {e.status ?? 'NEW'}
                  </Badge>
                </Td>
                <Td className="text-slate-500 text-xs">
                  {e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}
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
