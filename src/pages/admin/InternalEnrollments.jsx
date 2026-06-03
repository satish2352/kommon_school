/**
 * InternalEnrollments
 * -------------------
 * Dedicated admin page for the internal-flow enrollments only.
 *
 * Listing intentionally mirrors the simpler `/admin/enrollments` table
 * (ENROLLMENT ID / NAME / EMAIL / PHONE / TYPE / PAYMENT STATUS / CREATED)
 * — heavy financial breakdown lives inside the row-click drawer, NOT
 * inline. Clicking a row opens `EnrollmentDetailsDrawer`, which renders
 * the 3-section breakdown (Plan / Financial Summary / Payment
 * History) with status pills.
 *
 * Server-side filter pinned to `candidateType=INTERNAL` so this page
 * never shows public-website rows even if the user types into the URL.
 */

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  EnrollmentDetailsDrawer,
} from '../../components/admin';

/* ─── Payment-status pill (PAID / PARTIAL / PENDING / FULLY_DISCOUNTED) ── */
const PAY_STATUS_STYLE = {
  PAID:             'bg-emerald-50 text-emerald-700 border-emerald-200',
  PARTIAL:          'bg-amber-50 text-amber-700 border-amber-200',
  PENDING:          'bg-rose-50 text-rose-700 border-rose-200',
  FULLY_DISCOUNTED: 'bg-violet-50 text-violet-700 border-violet-200',
};
const PAY_STATUS_LABEL = {
  PAID:             'PAID',
  PARTIAL:          'PARTIAL',
  PENDING:          'PENDING',
  FULLY_DISCOUNTED: 'FULLY DISCOUNTED',
};
function PaymentStatusPill({ status }) {
  if (!status) return <span className="text-slate-400">—</span>;
  return (
    <span
      className={`inline-flex items-center px-3 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide whitespace-nowrap ${
        PAY_STATUS_STYLE[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'
      }`}
    >
      {PAY_STATUS_LABEL[status] ?? status}
    </span>
  );
}

/* ─── Skeleton rows (7 cols) ──────────────────────────────────────────── */
const COLS = 7;
function SkeletonRows({ count = 7 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Tr key={i} striped={i % 2 === 1}>
          {Array.from({ length: COLS }).map((__, j) => (
            <Td key={j}><Skeleton w="w-24" /></Td>
          ))}
        </Tr>
      ))}
    </>
  );
}

export default function InternalEnrollments() {
  const [page, setPage] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [fromDate, setFromDate]           = useState('');
  const [toDate, setToDate]               = useState('');

  const [openId, setOpenId] = useState(null);

  /* ?focus=<id> deep-link from the New Enrollment success screen.
     Open the drawer for the newly-created enrollment on landing, then
     strip the query param so a refresh doesn't keep re-opening it. */
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const focus = searchParams.get('focus');
    if (focus) {
      setOpenId(focus);
      const next = new URLSearchParams(searchParams);
      next.delete('focus');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtersActive = paymentStatus !== 'ALL' || fromDate || toDate;
  const resetFilters = () => {
    setPaymentStatus('ALL');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  // Server-side filter pinned to INTERNAL. payment-status filter is
  // applied client-side because the list endpoint doesn't currently
  // accept it as a query param (adding it server-side is a one-line
  // change when needed).
  const filters = useMemo(() => ({
    page,
    limit: 20,
    candidateType: 'INTERNAL',
    source:        'INTERNAL',
    ...(fromDate ? { fromDate } : {}),
    ...(toDate   ? { toDate }   : {}),
  }), [page, fromDate, toDate]);
  const { data, loading, error } = useAdminEnrollments(filters);

  const rawItems = data?.items ?? data?.data ?? data ?? [];

  /**
   * Effective payment status for an internal row.
   *
   *   - If the snapshot column `internalPaymentStatus` is populated, use it
   *     verbatim (every new admin enrollment has this set).
   *   - Otherwise, fall back to the enrollment lifecycle status: a legacy
   *     INTERNAL row with status='paid' is treated as PAID for both the
   *     filter and the displayed pill, so the UI is internally consistent.
   *   - Anything else → null (renders as "—" in the cell).
   *
   * Returning the same value the display uses means a "Paid" filter
   * selection matches exactly the rows that visually show "PAID".
   */
  const effectiveStatus = (e) => {
    if (e.internalPaymentStatus) return e.internalPaymentStatus;
    if (e.status === 'paid' || e.status === 'PAID') return 'PAID';
    return null;
  };

  // Defensive client-side filter: keep only internal rows + apply
  // payment-status filter against the same effective status the cell renders.
  const items = useMemo(() => {
    return rawItems.filter((e) => {
      const isInternal =
        e.candidateType === 'INTERNAL' ||
        e.internalPlanId != null ||
        e.internal_plan_id != null;
      if (!isInternal) return false;
      if (paymentStatus !== 'ALL' && effectiveStatus(e) !== paymentStatus) return false;
      return true;
    });
  }, [rawItems, paymentStatus]);

  const total   = data?.total ?? data?.pagination?.total ?? items.length;
  const hasNext = rawItems.length === 20;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Enrollments"
        subtitle="Admin-created enrollments — click a row to see the full breakdown"
        action={<span className="text-sm text-slate-500 mr-2">{total} total</span>}
      />

      {/* Filter bar */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48">
            {/* Admin path collects full payment up-front, so the only
                outcomes are PAID and FULLY_DISCOUNTED. PARTIAL / PENDING
                stay in the DB enum for future flexibility but aren't
                exposed as filter options to avoid confusion. */}
            <Select
              label="Payment Status"
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
            >
              <option value="ALL">All statuses</option>
              <option value="PAID">Paid</option>
              <option value="FULLY_DISCOUNTED">Fully Discounted</option>
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

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error.message}
        </div>
      )}

      {/* Simple 7-column list — click row for the drawer */}
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
                title={filtersActive || page > 1 ? 'No internal enrollments match the current filters' : 'No internal enrollments yet'}
                description={filtersActive
                  ? 'Try widening the date range or resetting the payment-status filter.'
                  : 'Create one from "New Enrollment" — they will appear here.'}
              />
            )}

            {!loading && !error && items.map((e, idx) => {
              const createdAt = e.createdAt ?? e.created_at;
              return (
                <Tr
                  key={e.id}
                  striped={idx % 2 === 1}
                  className="cursor-pointer hover:bg-indigo-50/40"
                  onClick={() => setOpenId(e.id)}
                >
                  <Td className="font-mono text-xs text-slate-500">
                    {e.enrollmentId ?? e.id}
                  </Td>
                  <Td className="text-slate-900 font-medium">
                    {(e.fullName ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim()) || '—'}
                  </Td>
                  <Td className="text-slate-600">{e.email}</Td>
                  <Td className="text-slate-600">{e.phone}</Td>
                  <Td>
                    <Badge variant="info">Internal</Badge>
                  </Td>
                  <Td>
                    {/* Same `effectiveStatus()` used by the filter, so
                        what you see is what the filter matches. Legacy
                        rows with status='paid' but no snapshot still
                        render as the green PAID pill and ARE picked up
                        by the "Paid" filter. */}
                    <PaymentStatusPill status={effectiveStatus(e)} />
                  </Td>
                  <Td className="text-slate-500 text-xs whitespace-nowrap">
                    {createdAt ? new Date(createdAt).toLocaleString() : '—'}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {/* Pagination */}
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

      {/* Drawer — full 3-section breakdown (Plan / Financial Summary / Payment History) */}
      <EnrollmentDetailsDrawer
        enrollmentId={openId}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}
