/**
 * EnrollmentDetailsDrawer
 * -----------------------
 * Right-side slide-out drawer that fetches a single enrollment via
 * GET /admin/enrollments/:id and renders three sections:
 *
 *   1. Plan Details        — course, plan, duration, original amount
 *   2. Financial Summary   — original − discount = final / paid / pending
 *                            + payment status badge (PAID, PARTIAL,
 *                            PENDING, FULLY_DISCOUNTED) with colour
 *   3. Payment History     — every Payment row (date, mode, amount,
 *                            transaction id, status, collected-by hint)
 *
 * All numbers come straight from the backend (paise → /100); the frontend
 * never recalculates. The drawer renders nothing when `enrollmentId` is
 * null, which the parent toggles to open/close.
 *
 * Props:
 *   enrollmentId — UUID of the enrollment to load, or null to keep closed
 *   onClose      — () => void
 */

import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
const inr = (rupees) =>
  rupees == null
    ? '—'
    : `₹${Number(rupees).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const paiseToInr = (paise) => (paise == null ? '—' : inr(paise / 100));

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return '—'; }
};

const DURATION_LABEL = {
  '1_MONTH':     '1 Month',
  '3_MONTHS':    '3 Months',
  '6_MONTHS':    '6 Months',
  '12_MONTHS':   '12 Months',
  ONE_MONTH:     '1 Month',
  THREE_MONTHS:  '3 Months',
  SIX_MONTHS:    '6 Months',
  TWELVE_MONTHS: '12 Months',
};

// Status pill colour rules per the spec.
const STATUS_STYLE = {
  PAID:             { label: 'Paid',             cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  PARTIAL:          { label: 'Partial',          cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  PENDING:          { label: 'Pending',          cls: 'bg-rose-100 text-rose-700 border-rose-200' },
  FULLY_DISCOUNTED: { label: 'Fully Discounted', cls: 'bg-violet-100 text-violet-700 border-violet-200' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? { label: status ?? '—', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  const m = {
    success:   'bg-emerald-100 text-emerald-700',
    initiated: 'bg-slate-100 text-slate-600',
    pending:   'bg-amber-100 text-amber-700',
    failed:    'bg-rose-100 text-rose-700',
    cancelled: 'bg-slate-100 text-slate-500',
    expired:   'bg-slate-100 text-slate-500',
    refunded:  'bg-violet-100 text-violet-700',
  };
  const cls = m[status] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {status ?? '—'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper + row
// ---------------------------------------------------------------------------
function Section({ number, title, children, accent }) {
  return (
    <div className={`rounded-xl border p-4 bg-white ${accent ?? 'border-slate-200'}`}>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold">
          {number}
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, accent = 'text-slate-800' }) {
  return (
    <div className="flex justify-between items-baseline py-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm font-medium tabular-nums ${accent}`}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------
export default function EnrollmentDetailsDrawer({ enrollmentId, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Fetch when opened (or when id changes while already open). Reset on
  // close so the next open doesn't briefly show stale data.
  useEffect(() => {
    if (!enrollmentId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminService.getEnrollmentById(enrollmentId)
      .then((res) => { if (!cancelled) { setData(res); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err); setLoading(false); } });
    return () => { cancelled = true; };
  }, [enrollmentId]);

  // ESC closes. (The public enrollment modal explicitly suppresses ESC
  // for payment safety; this is a read-only admin surface, ESC is fine.)
  useEffect(() => {
    if (!enrollmentId) return undefined;
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [enrollmentId, onClose]);

  if (!enrollmentId) return null;

  const isFullyDiscounted = data?.internalPaymentStatus === 'FULLY_DISCOUNTED';

  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enrollment-details-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-slate-50 w-full max-w-2xl h-full overflow-y-auto shadow-2xl border-l border-slate-200">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 z-10 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-indigo-600 font-semibold">
              Enrollment Details
            </p>
            <h2 id="enrollment-details-title" className="text-lg font-bold text-slate-900 truncate">
              {data?.fullName || data?.enrollmentId || '…'}
            </h2>
            {data?.enrollmentId && (
              <p className="text-xs text-slate-400 font-mono">{data.enrollmentId}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 shrink-0"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading && (
            <div className="py-10 text-center text-slate-500 text-sm">Loading…</div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error.message ?? 'Failed to load enrollment'}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Student snapshot (always shown) */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Student
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="text-xs text-slate-400">Email</span><div className="text-slate-800 break-words">{data.email}</div></div>
                  <div><span className="text-xs text-slate-400">Phone</span><div className="text-slate-800">{data.phone ?? '—'}</div></div>
                  <div><span className="text-xs text-slate-400">Role</span><div className="text-slate-800">{data.role ?? '—'}</div></div>
                  <div><span className="text-xs text-slate-400">Education</span><div className="text-slate-800">{data.education ?? '—'}</div></div>
                  <div><span className="text-xs text-slate-400">Created</span><div className="text-slate-800">{fmtDateTime(data.createdAt)}</div></div>
                  <div><span className="text-xs text-slate-400">Type</span><div className="text-slate-800">{data.candidateType}</div></div>
                </div>
              </div>

              {data.candidateType !== 'INTERNAL' && (
                <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-xs text-slate-500">
                  This enrollment came from the public website flow. Internal
                  financial breakdown only applies to admin-internal enrollments.
                </div>
              )}

              {data.candidateType === 'INTERNAL' && (
                <>
                  {/* Section 1: Plan */}
                  <Section number="1" title="Plan Details">
                    <Row label="Course"   value={data.internalPlan?.course?.name ?? '—'} />
                    <Row label="Plan"     value={data.internalPlan?.name ?? '—'} />
                    <Row label="Duration" value={DURATION_LABEL[data.internalPlan?.duration] ?? data.internalPlan?.duration ?? '—'} />
                    <Row
                      label="Original Amount"
                      value={paiseToInr(data.basePricePaise)}
                      accent="text-slate-900 font-semibold"
                    />
                  </Section>

                  {/* Section 2: Financial Summary
                      Admin always collects full payment up-front, so we
                      only display the Original − Discount = Final formula
                      and the status pill (PAID or FULLY_DISCOUNTED). No
                      Paid / Pending rows — they would always equal Final
                      and 0 respectively, which is just visual noise. */}
                  <Section
                    number="2"
                    title="Financial Summary"
                    accent={
                      data.internalPaymentStatus === 'FULLY_DISCOUNTED'
                        ? 'border-violet-200 bg-violet-50/30'
                        : 'border-emerald-200 bg-emerald-50/30'
                    }
                  >
                    <Row label="Original Amount" value={paiseToInr(data.basePricePaise)} />
                    <Row
                      label="− Discount"
                      value={data.discountAmountPaise > 0 ? `− ${paiseToInr(data.discountAmountPaise)}` : '—'}
                      accent={data.discountAmountPaise > 0 ? 'text-emerald-700' : 'text-slate-400'}
                    />
                    <div className="border-t border-slate-200 mt-2 pt-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-semibold text-slate-800">= Final Payable</span>
                        <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                          {paiseToInr(data.finalAmountPaise)}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 mt-3 pt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Payment Status</span>
                      <StatusBadge status={data.internalPaymentStatus} />
                    </div>
                  </Section>

                  {/* Section 3: Payment History */}
                  <Section number="3" title="Payment Attempts / History">
                    {isFullyDiscounted && (data.payments ?? []).length === 0 ? (
                      <div className="text-sm text-slate-500 italic py-2">
                        No payment records — this enrollment was fully discounted (₹0 due).
                      </div>
                    ) : (data.payments ?? []).length === 0 ? (
                      <div className="text-sm text-slate-400 italic py-2">No payment records yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-[10px] uppercase tracking-wider text-slate-400">
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-2 pr-3 font-semibold">Date</th>
                              <th className="text-left py-2 pr-3 font-semibold">Mode</th>
                              <th className="text-right py-2 pr-3 font-semibold">Amount</th>
                              <th className="text-left py-2 pr-3 font-semibold">Transaction ID</th>
                              <th className="text-left py-2 pr-3 font-semibold">Status</th>
                              <th className="text-left py-2 font-semibold">Collected By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {data.payments.map((p) => (
                              <tr key={p.id}>
                                <td className="py-2 pr-3 text-slate-700 whitespace-nowrap">{fmtDateTime(p.createdAt)}</td>
                                <td className="py-2 pr-3 text-slate-700">
                                  {p.mode === 'ADMIN_MANUAL'
                                    ? <span className="inline-flex px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase">Admin</span>
                                    : <span className="inline-flex px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">Razorpay</span>}
                                </td>
                                <td className="py-2 pr-3 text-right text-slate-900 tabular-nums font-medium">
                                  {paiseToInr(p.amountPaise)}
                                </td>
                                <td className="py-2 pr-3 text-slate-500 font-mono text-[11px] break-all">
                                  {p.razorpayPaymentId || p.razorpayOrderId || '—'}
                                </td>
                                <td className="py-2 pr-3"><PaymentStatusBadge status={p.status} /></td>
                                <td className="py-2 text-slate-500 text-xs">
                                  {p.collectedBy || (p.mode === 'ADMIN_MANUAL' ? 'Admin' : '—')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Section>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
