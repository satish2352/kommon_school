import { useState, useMemo } from 'react';
import { useAdminPayments, useAdminFailedPayments } from '../../hooks/useAdmin';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Table,
  Th,
  Td,
  Tr,
  PageLoader,
  EmptyState,
} from '../../components/admin';

/* ─── Status badge variant map ───────────────────────────────────────────── */
function paymentBadgeVariant(status) {
  const map = {
    SUCCESS:     'success',
    FAILED:      'danger',
    EXPIRED:     'neutral',
    PENDING:     'warning',
    IN_PROGRESS: 'info',
    CREATED:     'neutral',
    REFUNDED:    'neutral',
    PARTIAL:     'warning',
  };
  return map[status] ?? 'neutral';
}

const inr = (paise) =>
  paise == null
    ? '—'
    : `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/* ─── Column count ───────────────────────────────────────────────────────── */
const HEADER_COLS = ['Sr No', 'Enrollment', 'Name', 'Email', 'Phone', 'Razorpay order', 'Razorpay payment', 'Amount', 'Status', 'Created'];
const COL_COUNT = HEADER_COLS.length; // 10

export default function Payments() {
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const filters = useMemo(() => ({ page, limit: 20 }), [page]);

  const allQuery    = useAdminPayments(tab === 'all'    ? filters : null);
  const failedQuery = useAdminFailedPayments(tab === 'failed' ? filters : null);
  const active = tab === 'all' ? allQuery : failedQuery;

  const items = active.data?.items ?? active.data?.data ?? active.data ?? [];
  const total = active.data?.total ?? active.data?.pagination?.total ?? items.length;
  const hasNext = items.length === 20;

  const switchTab = (t) => { setTab(t); setPage(1); };

  // Only filter on this page is the All/Failed tab. Reset returns it to default.
  const filtersActive = tab !== 'all' || page > 1;
  const resetFilters = () => { setTab('all'); setPage(1); };

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="Payments"
        subtitle="Review and investigate payment transactions"
        action={
          <span className="text-sm text-slate-500">{total} total</span>
        }
      />

      {/* ── Tab filter ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'failed', label: 'Failed only' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => switchTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              tab === key
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto">
          <Button variant="secondary" size="sm" onClick={resetFilters} disabled={!filtersActive}>
            Reset filters
          </Button>
        </div>
      </div>

      {/* ── Error state ──────────────────────────────────────────────────── */}
      {active.error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {active.error.message}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <Card variant="flush">
        <Table>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {HEADER_COLS.map((h, i) => (
                <Th key={h} align={i === 7 ? 'right' : 'left'}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {active.loading && (
              <tr>
                <td colSpan={COL_COUNT}>
                  <PageLoader label="Loading payments…" minH="min-h-[200px]" />
                </td>
              </tr>
            )}

            {!active.loading && !active.error && items.length === 0 && (
              <EmptyState
                colSpan={COL_COUNT}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                }
                title={tab === 'failed' ? 'No failed payments — great news!' : 'No payments match the current filter'}
                description={tab === 'failed' ? 'Failed transactions will appear here.' : 'Payments will appear here once processed.'}
              />
            )}

            {!active.loading && !active.error && items.map((p, idx) => (
              <Tr key={p.id} striped={idx % 2 === 1}>
                <Td className="text-slate-500 text-sm font-mono">{(page - 1) * 20 + idx + 1}</Td>
                <Td className="font-mono text-xs text-slate-500">
                  {p.enrollment?.enrollmentId ?? '—'}
                </Td>
                <Td className="text-slate-900 font-medium">
                  {p.enrollment?.fullName ?? '—'}
                </Td>
                <Td className="text-slate-600">
                  {p.enrollment?.email ?? '—'}
                </Td>
                <Td className="text-slate-600">
                  {p.enrollment?.phone ?? '—'}
                </Td>
                <Td className="font-mono text-xs text-slate-500">
                  {p.razorpayOrderId ?? '—'}
                </Td>
                <Td className="font-mono text-xs text-slate-500">
                  {p.razorpayPaymentId ?? '—'}
                </Td>
                <Td align="right" className="text-slate-900 font-semibold">
                  {inr(p.finalAmount ?? p.amount)}
                </Td>
                <Td>
                  <Badge variant={paymentBadgeVariant(p.status)}>
                    {p.status}
                  </Badge>
                </Td>
                <Td className="text-slate-500 text-xs">
                  {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
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
