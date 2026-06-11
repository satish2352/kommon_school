/**
 * ExternalEnrollments
 * -------------------
 * Dedicated admin page for the public-website (EXTERNAL) enrollments only.
 *
 * Mirrors the Internal Enrollments table, but pinned to candidateType=EXTERNAL
 * via the shared grouped endpoint (one row per email, latest first). External
 * rows have no internal payment-status snapshot, so the Status column shows the
 * enrollment lifecycle status. Clicking a row (or the email) opens that
 * student's full history.
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Table,
  Th,
  Td,
  Tr,
  PageLoader,
  EmptyState,
} from '../../components/admin';

const COLS = 9;

/* ─── Status badge variant map (matches the main Enrollments page) ─────── */

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

export default function ExternalEnrollments() {
  const navigate = useNavigate();
  const [page, setPage]         = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');

  const filtersActive = fromDate || toDate;
  const resetFilters = () => { setFromDate(''); setToDate(''); setPage(1); };

  // Grouped endpoint returns ONE row per email (latest enrollment + count),
  // pinned to EXTERNAL server-side.
  const filters = useMemo(() => ({
    page,
    limit: 20,
    candidateType: 'EXTERNAL',
    ...(fromDate ? { fromDate } : {}),
    ...(toDate   ? { toDate }   : {}),
  }), [page, fromDate, toDate]);

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminService.listEnrollmentsGrouped(filters)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const rawItems = data?.items ?? [];

  // Defensive: keep only external rows (the server already filters, but never
  // show an internal row even if the API shape changes).
  const items = useMemo(
    () => rawItems.filter((e) => (e.candidateType ?? 'EXTERNAL') !== 'INTERNAL' && e.internalPlanId == null),
    [rawItems],
  );

  const total      = data?.total ?? items.length;
  const totalPages = data?.totalPages ?? 1;
  const hasNext    = page < totalPages;

  return (
    <div className="space-y-6">
      <PageHeader
        title="External Enrollments"
        subtitle="Public-website enrollments only — one row per student; click a row to see all their enrollments"
        action={<span className="text-sm text-slate-500 mr-2">{total} total</span>}
      />

      {/* Filter bar */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
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

      <Card variant="flush">
        <Table>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Sr No', 'Enrollment ID', 'Name', 'Email', 'Phone', 'Type', 'Active Plan', 'Status', 'Created'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={COLS}>
                  <PageLoader label="Loading external enrollments…" minH="min-h-[200px]" />
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
                title={filtersActive || page > 1 ? 'No external enrollments match the current filters' : 'No external enrollments yet'}
                description={filtersActive
                  ? 'Try widening the date range or resetting the filters.'
                  : 'Public-website enrollments will appear here.'}
              />
            )}

            {!loading && !error && items.map((e, idx) => {
              const createdAt = e.createdAt ?? e.created_at;
              return (
                <Tr
                  key={e.id}
                  striped={idx % 2 === 1}
                  className="cursor-pointer hover:bg-indigo-50/40"
                  onClick={() => navigate(`/admin/students/${encodeURIComponent(e.email)}`)}
                >
                  <Td className="text-slate-500 text-sm font-mono">
                    {(page - 1) * 20 + idx + 1}
                  </Td>
                  <Td className="font-mono text-xs text-slate-500">{e.enrollmentId ?? e.id}</Td>
                  <Td className="text-slate-900 font-medium">
                    <span className="inline-flex items-center gap-2">
                      {(e.fullName ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim()) || '—'}
                      {e.enrollmentCount > 1 && (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                          {e.enrollmentCount} enrollments
                        </span>
                      )}
                    </span>
                  </Td>
                  <Td className="text-slate-600">
                    <button
                      type="button"
                      onClick={(ev) => { ev.stopPropagation(); navigate(`/admin/students/${encodeURIComponent(e.email)}`); }}
                      className="text-left hover:text-indigo-700 hover:underline"
                      title="View all enrollments for this email"
                    >
                      {e.email}
                    </button>
                  </Td>
                  <Td className="text-slate-600">{e.phone}</Td>
                  <Td>
                    <Badge variant="neutral">External</Badge>
                  </Td>
                  {/* Active Plan — latest PAID plan's Plan ID + days left. */}
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
                    <Badge variant={enrollmentBadgeVariant(e.status)}>{e.status ?? 'NEW'}</Badge>
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
    </div>
  );
}
