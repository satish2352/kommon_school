import { useState, useMemo } from 'react';
import { useAdminEnrollments } from '../../hooks/useAdmin';

export default function Enrollments() {
  const [page, setPage] = useState(1);
  const filters = useMemo(() => ({ page, limit: 20 }), [page]);
  const { data, loading, error } = useAdminEnrollments(filters);

  const items = data?.items ?? data?.data ?? data ?? [];
  const total = data?.total ?? data?.pagination?.total ?? items.length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Enrollments</h1>

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
                <th className="px-4 py-3 text-left">Enrollment ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No enrollments yet.
                  </td>
                </tr>
              )}
              {items.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{e.enrollmentId ?? e.id}</td>
                  <td className="px-4 py-3 text-gray-900">{e.fullName ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim()}</td>
                  <td className="px-4 py-3 text-gray-700">{e.email}</td>
                  <td className="px-4 py-3 text-gray-700">{e.phone}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
                      {e.status ?? 'NEW'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}
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
