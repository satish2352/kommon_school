import { useAdminDashboard } from '../../hooks/useAdmin';

const Card = ({ label, value, hint }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="mt-2 text-3xl font-bold text-gray-900">{value ?? '—'}</div>
    {hint ? <div className="text-xs text-gray-400 mt-1">{hint}</div> : null}
  </div>
);

const inr = (paise) =>
  paise == null ? '—' : `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function Dashboard() {
  const { data, loading, error, refetch } = useAdminDashboard();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <button
          onClick={refetch}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-100"
        >
          Refresh
        </button>
      </div>

      {loading && <div className="text-gray-500">Loading…</div>}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error.message}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="Today: enrollments" value={data.today?.enrollments} />
          <Card label="Today: revenue" value={inr(data.today?.revenuePaise)} hint="UTC day" />
          <Card label="Pending payments" value={data.pending?.payments} />
          <Card label="Pending follow-ups" value={data.pending?.followUps} />
        </div>
      )}
    </div>
  );
}
