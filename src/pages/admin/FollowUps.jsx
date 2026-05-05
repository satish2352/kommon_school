import { useState, useMemo } from 'react';
import { useFollowUps } from '../../hooks/useFollowUps';

const STATUS_COLOR = {
  NEW: 'bg-blue-50 text-blue-700',
  CONTACTED: 'bg-cyan-50 text-cyan-700',
  FOLLOW_UP: 'bg-amber-50 text-amber-700',
  CALLBACK: 'bg-orange-50 text-orange-700',
  PAYMENT_PENDING: 'bg-yellow-50 text-yellow-700',
  CONVERTED: 'bg-green-50 text-green-700',
  NOT_INTERESTED: 'bg-gray-100 text-gray-600',
  CLOSED: 'bg-gray-100 text-gray-500',
};

export default function FollowUps() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const filters = useMemo(() => ({ page, limit: 20, status: status || undefined }), [page, status]);
  const { data, loading, error } = useFollowUps(filters);

  const items = data?.items ?? data?.data ?? data ?? [];
  const total = data?.total ?? data?.pagination?.total ?? items.length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Follow-ups</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'NEW', 'CONTACTED', 'FOLLOW_UP', 'CALLBACK', 'CONVERTED', 'CLOSED'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              status === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading && <div className="text-gray-500">Loading…</div>}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error.message}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Enrollment</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Calls</th>
                <th className="px-4 py-3 text-left">Next follow-up</th>
                <th className="px-4 py-3 text-left">Last contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No follow-ups.
                  </td>
                </tr>
              )}
              {items.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{f.enrollmentId ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[f.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{f.priority}</td>
                  <td className="px-4 py-3 text-gray-700">{f.callAttempts ?? 0}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {f.nextFollowUpAt ? new Date(f.nextFollowUpAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {f.lastContactAt ? new Date(f.lastContactAt).toLocaleString() : '—'}
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
