import { useState, useMemo } from 'react';
import { useAdminPayments, useAdminFailedPayments } from '../../hooks/useAdmin';

const STATUS_COLOR = {
  SUCCESS: 'bg-green-50 text-green-700',
  FAILED: 'bg-red-50 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  CREATED: 'bg-gray-50 text-gray-700',
  REFUNDED: 'bg-purple-50 text-purple-700',
  PARTIAL: 'bg-indigo-50 text-indigo-700',
};

const inr = (paise) =>
  paise == null ? '—' : `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function Payments() {
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const filters = useMemo(() => ({ page, limit: 20 }), [page]);

  const allQuery = useAdminPayments(tab === 'all' ? filters : null);
  const failedQuery = useAdminFailedPayments(tab === 'failed' ? filters : null);
  const active = tab === 'all' ? allQuery : failedQuery;

  const items = active.data?.items ?? active.data?.data ?? active.data ?? [];
  const total = active.data?.total ?? active.data?.pagination?.total ?? items.length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Payments</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setTab('all'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => { setTab('failed'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'failed' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Failed only
        </button>
      </div>

      {active.loading && <div className="text-gray-500">Loading…</div>}
      {active.error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {active.error.message}
        </div>
      )}

      {!active.loading && !active.error && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Razorpay order</th>
                <th className="px-4 py-3 text-left">Razorpay payment</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No payments to show.
                  </td>
                </tr>
              )}
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.razorpayOrderId ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.razorpayPaymentId ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-900 text-right">{inr(p.finalAmount ?? p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[p.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div>{total} total</div>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40"
          >
            Prev
          </button>
          <div className="px-3 py-1.5">Page {page}</div>
          <button
            disabled={items.length < 20}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
