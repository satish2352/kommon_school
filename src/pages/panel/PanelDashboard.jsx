import { Link } from 'react-router-dom';
import { PageHeader, Card, StatCard, Badge, Table, Th, Td, Tr, EmptyState } from '../../components/admin';
import { useAccount } from './useAccount';

/* ── Formatters ─────────────────────────────────────────────────────────── */
// planHistory `amount` is denominated in rupees (whole-number INR), matching
// the Sumago integration payload and the admin SumagoUsers view.
const formatRupees = (n) =>
  n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatDate = (iso) => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const onboardingVariant = (status) => {
  const s = String(status ?? '').toUpperCase();
  if (s === 'SUCCESS' || s === 'COMPLETED') return 'success';
  if (s === 'PENDING' || s === 'IN_REVIEW') return 'warning';
  if (s === 'FAILED') return 'danger';
  return 'neutral';
};

const Icon = {
  plan: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" />
    </svg>
  ),
  rupee: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10" />
    </svg>
  ),
  receipt: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1z" /><path d="M8 7h8M8 11h8" />
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" />
    </svg>
  ),
};

export default function PanelDashboard() {
  const { profile, transactions, loading, error } = useAccount();

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
  const greetingName = fullName || profile?.email?.split('@')[0] || 'there';

  const totalPaid = transactions.reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);
  const currentPlan = profile?.plan ?? transactions[0]?.plan ?? '—';
  const recent = transactions.slice(0, 5);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Your account at a glance" />
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={loading ? 'Dashboard' : `Welcome back, ${greetingName}`}
        subtitle="Your account at a glance"
        action={
          <div className="flex items-center gap-3">
            {profile?.onboardingStatus && (
              <Badge variant={onboardingVariant(profile.onboardingStatus)}>
                Onboarding: {profile.onboardingStatus}
              </Badge>
            )}
            <Link
              to="/panel/purchase"
              className="btn-gradient-cta inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold text-sm shadow hover:shadow-md transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Buy a Plan
            </Link>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current Plan"
          value={loading ? '…' : currentPlan}
          icon={Icon.plan}
          accentClass="from-brand-500 to-brand-700"
        />
        <StatCard
          label="Total Paid"
          value={loading ? '…' : formatRupees(totalPaid)}
          hint={`${transactions.length} transaction${transactions.length === 1 ? '' : 's'}`}
          icon={Icon.rupee}
          accentClass="from-emerald-500 to-emerald-700"
        />
        <StatCard
          label="Transactions"
          value={loading ? '…' : transactions.length}
          icon={Icon.receipt}
          accentClass="from-indigo-500 to-indigo-700"
        />
        <StatCard
          label="Onboarding"
          value={loading ? '…' : (profile?.onboardingStatus ?? '—')}
          icon={Icon.check}
          accentClass="from-amber-500 to-amber-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <Card title="My Profile" className="lg:col-span-1">
          <dl className="space-y-3 text-[13px]">
            <Row label="Name" value={fullName || '—'} />
            <Row label="Email" value={profile?.email ?? '—'} />
            <Row label="Phone" value={profile?.phoneNumber ?? '—'} />
            <Row label="Plan" value={currentPlan} />
            {profile?.group && <Row label="Group" value={profile.group} />}
            {profile?.segment && <Row label="Segment" value={profile.segment} />}
            <Row label="Member since" value={formatDate(profile?.memberSince)} />
          </dl>
        </Card>

        {/* Recent transactions */}
        <Card title="Recent Transactions" variant="flush" className="lg:col-span-2">
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Plan</Th>
                <Th>Transaction ID</Th>
                <Th align="right">Amount</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><Td colSpan={4} align="center" className="!py-10 text-slate-400">Loading…</Td></tr>
              ) : recent.length === 0 ? (
                <EmptyState
                  colSpan={4}
                  title="No transactions yet"
                  description="Your payment history will appear here once your first payment is recorded."
                />
              ) : (
                recent.map((t, i) => (
                  <Tr key={t.transactionId ?? i} striped={i % 2 === 1}>
                    <Td>{formatDate(t.paymentDate)}</Td>
                    <Td>{t.plan ?? '—'}</Td>
                    <Td className="font-mono text-xs text-slate-500">{t.transactionId ?? '—'}</Td>
                    <Td align="right" className="font-medium">{formatRupees(t.amount)}</Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
          {!loading && transactions.length > recent.length && (
            <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--admin-border)' }}>
              <Link to="/panel/transactions" className="text-[13px] font-medium text-brand-600 hover:text-brand-700">
                View all {transactions.length} transactions →
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="text-slate-800 font-medium text-right break-all">{value}</dd>
    </div>
  );
}
