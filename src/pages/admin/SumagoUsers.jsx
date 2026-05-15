import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { webhookAdminService } from '../../services/webhookAdminService';
import { PageHeader, Card, Button } from '../../components/admin';

/**
 * SumagoUsers — admin page for the GET side of the Sumago Platform
 * Integration API. Proxies through the backend so the Bearer token never
 * leaves the server.
 *
 * Endpoint shown: GET <SUMAGO_API_BASE_URL>/integrations/get-users
 */
export default function SumagoUsers() {
  const [config, setConfig]     = useState(null);   // { enabled, baseUrl }
  const [users, setUsers]       = useState(null);   // last fetch result
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // Load config on mount so the badge reflects backend env state.
  useEffect(() => {
    let cancelled = false;
    webhookAdminService.getSumagoConfig()
      .then((cfg) => { if (!cancelled) setConfig(cfg); })
      .catch(() => { if (!cancelled) setConfig({ enabled: false, baseUrl: null }); });
    return () => { cancelled = true; };
  }, []);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await webhookAdminService.fetchSumagoUsers();
      setUsers(data);
      toast.success(`Fetched ${data?.totalUsers ?? data?.users?.length ?? 0} user(s) from Sumago`);
    } catch (err) {
      setError(err.message ?? 'Failed to fetch Sumago users');
      toast.error(err.message ?? 'Failed to fetch Sumago users');
    } finally {
      setLoading(false);
    }
  };

  const endpoint = config?.baseUrl
    ? `${config.baseUrl}/integrations/get-users`
    : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sumago — Fetch Users"
        subtitle="GET /integrations/get-users — retrieve all users provisioned to your organization"
        action={
          <Button
            variant="primary"
            loading={loading}
            onClick={handleFetch}
            disabled={!config?.enabled || loading}
          >
            {loading ? 'Fetching…' : 'Fetch users from Sumago'}
          </Button>
        }
      />

      <Card title="Endpoint">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                config?.enabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config?.enabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {config?.enabled ? 'Configured' : 'Not configured'}
            </span>
            <code className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded font-mono">
              GET {endpoint}
            </code>
          </div>

          {!config?.enabled && (
            <p className="text-xs text-slate-500">
              Set <span className="font-mono">SUMAGO_API_BASE_URL</span> and <span className="font-mono">SUMAGO_API_TOKEN</span> in the backend env to enable. The Bearer token never leaves the server — this page proxies through the backend.
            </p>
          )}
        </div>
      </Card>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {users && (() => {
        // Sumago returns the org code under BOTH British and American spellings
        // depending on the deployment. Read whichever is present.
        const orgCode = users.organisationCode ?? users.organizationCode ?? '—';

        // Helper: derive the latest plan when `plan` is null by falling back to
        // the most recent entry in planHistory.
        const latestPlan = (u) => {
          if (u?.plan) return u.plan;
          const hist = u?.planHistory;
          if (Array.isArray(hist) && hist.length > 0) {
            const sorted = [...hist].sort((a, b) =>
              new Date(b?.paymentDate ?? 0) - new Date(a?.paymentDate ?? 0),
            );
            return sorted[0]?.plan ?? null;
          }
          return null;
        };

        // Helper: total paid across planHistory entries.
        const totalPaid = (u) => {
          const hist = u?.planHistory;
          if (!Array.isArray(hist) || hist.length === 0) return null;
          return hist.reduce((s, p) => s + (Number(p?.amount) || 0), 0);
        };

        return (
          <Card title={`Users (${users.totalUsers ?? users.users?.length ?? 0})`}>
            <div className="space-y-3">
              <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                <span><b>Organisation:</b> {orgCode}</span>
                <span><b>Status:</b> {users.status ?? '—'}</span>
                <span><b>Total users:</b> {users.totalUsers ?? users.users?.length ?? 0}</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">User ID</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Name</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Email</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Phone</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Plan</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Group</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Unit</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Phase</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Segment</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Email</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Onboarding</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Payments</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Total ₹</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(users.users ?? []).length === 0 ? (
                        <tr><td colSpan={13} className="px-3 py-6 text-center text-slate-400 text-sm">No users returned.</td></tr>
                      ) : (
                        (users.users ?? []).map((u, i) => {
                          const plan = latestPlan(u);
                          const planFromHistory = !u?.plan && plan;
                          const paid = totalPaid(u);
                          return (
                            <tr key={u.userId ?? u.email ?? i} className={i % 2 === 1 ? 'bg-slate-50/50' : ''}>
                              <td className="px-3 py-2 font-mono text-xs text-slate-700">{u.userId ?? '—'}</td>
                              <td className="px-3 py-2 text-slate-800">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</td>
                              <td className="px-3 py-2 text-slate-600">{u.email ?? '—'}</td>
                              <td className="px-3 py-2 text-slate-600">{u.phoneNumber ?? '—'}</td>
                              <td className="px-3 py-2">
                                {plan ? (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-brand-50 text-brand-700 border border-brand-200">{plan}</span>
                                    {planFromHistory && <span className="text-[10px] text-slate-400 italic" title="Derived from latest planHistory entry">latest</span>}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-700">{u.group ?? '—'}</td>
                              <td className="px-3 py-2 text-slate-700">{u.unit ?? '—'}</td>
                              <td className="px-3 py-2 text-slate-700">{u.phase ?? '—'}</td>
                              <td className="px-3 py-2 text-slate-700">{u.segment ?? '—'}</td>
                              <td className="px-3 py-2 text-slate-700">{u.emailStatus ?? '—'}</td>
                              <td className="px-3 py-2 text-slate-700">{u.onboardingStatus ?? '—'}</td>
                              <td className="px-3 py-2 text-right text-slate-700">{u.planHistory?.length ?? 0}</td>
                              <td className="px-3 py-2 text-right text-slate-700 font-mono text-xs">
                                {paid != null ? `₹${paid.toLocaleString('en-IN')}` : '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
