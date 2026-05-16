import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {
  useAdminDashboard,
  useAdminEnrollments,
  useAdminPayments,
} from '../../hooks/useAdmin';
import { useFollowUps } from '../../hooks/useFollowUps';
import { PageHeader, Card, StatCard, Skeleton } from '../../components/admin';

/* ─── Formatters ────────────────────────────────────────────────────────── */
const inr = (paise) =>
  paise == null ? '—' : `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const fmtNum = (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const dayKey = (d) => startOfDay(d).toISOString().slice(0, 10);

const last7Days = () => {
  const days = [];
  const now = startOfDay(new Date());
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
};

/* ─── Status colour maps ─────────────────────────────────────────────────── */
const FOLLOW_UP_COLORS = {
  NEW: '#2563EB',
  CONTACTED: '#06b6d4',
  FOLLOW_UP: '#f59e0b',
  CALLBACK: '#f97316',
  PAYMENT_PENDING: '#eab308',
  CONVERTED: '#10b981',
  NOT_INTERESTED: '#64748b',
  CLOSED: '#94a3b8',
};

const PAYMENT_COLORS = {
  SUCCESS: '#10b981',
  FAILED: '#ef4444',
  PENDING: '#f59e0b',
  IN_PROGRESS: '#2563EB',
  CREATED: '#94a3b8',
  EXPIRED: '#64748b',
  REFUNDED: '#a855f7',
  PARTIAL: '#1D4ED8',
};

/* ─── Skeleton helpers ───────────────────────────────────────────────────── */
function StatCardSkeleton() {
  // Mirrors the real StatCard layout:
  //   - h-full + flex flex-col so the skeleton fills its grid cell
  //   - label area min-h-[2.6em] matches the real card so the skeleton
  //     and the loaded card occupy the same vertical box (no layout
  //     shift when data resolves).
  return (
    <div
      className="bg-white rounded-xl border p-5 shadow-card h-full flex flex-col"
      style={{ borderColor: 'var(--admin-border, #E5E7EB)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 min-h-[2.6em]">
          <Skeleton w="w-24" h="h-3" />
        </div>
        <Skeleton w="w-10" h="h-10" className="rounded-lg shrink-0" />
      </div>
      <div className="mt-auto">
        <Skeleton w="w-20" h="h-7" className="mt-3" />
        <Skeleton w="w-24" h="h-3" className="mt-2" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-card" style={{ borderColor: 'var(--admin-border, #E5E7EB)' }}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton w="w-32" h="h-4" />
        <Skeleton w="w-12" h="h-3" />
      </div>
      <Skeleton w="w-full" h="h-[120px]" className="rounded-xl" />
      <div className="flex justify-between mt-2">
        <Skeleton w="w-4" h="h-3" />
        <Skeleton w="w-16" h="h-3" />
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function MiniBarChart({ data, format = (v) => v, color = '#2563EB', height = 120 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const width = 100;
  const barW = width / data.length - 2;
  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 22);
          const x = i * (barW + 2) + 1;
          const y = height - 18 - h;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h || 1}
                rx="1"
                fill={color}
                opacity={d.value === 0 ? 0.15 : 0.85}
              />
              <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize="4" fill="#94a3b8">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-slate-500 mt-2">
        <span>{format(0)}</span>
        <span className="text-slate-700 font-medium">Peak: {format(max)}</span>
      </div>
    </div>
  );
}

function Donut({ slices, size = 140 }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 12;
  const stroke = 18;
  let cumulative = 0;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-400" style={{ height: size }}>
        No data
      </div>
    );
  }

  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width={size} height={size} className="-rotate-90 shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        {slices.map((s, i) => {
          const fraction = s.value / total;
          const dash = fraction * circumference;
          const offset = -cumulative * circumference;
          cumulative += fraction;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
            />
          );
        })}
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          transform={`rotate(90 ${cx} ${cy})`}
          fontSize="18"
          fontWeight="700"
          fill="#0f172a"
        >
          {total}
        </text>
      </svg>
      <div className="flex-1 min-w-[120px] space-y-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
              <span className="text-slate-700 truncate">{s.label}</span>
            </div>
            <div className="text-slate-500 ml-2 shrink-0">
              <span className="font-semibold text-slate-900">{s.value}</span>
              <span className="ml-1 text-slate-400">({Math.round((s.value / total) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status, color }) {
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium leading-4"
      style={{ background: `${color}1A`, color }}
    >
      {status}
    </span>
  );
}

/* ─── Dashboard page ─────────────────────────────────────────────────────── */

export default function Dashboard() {
  useEffect(() => {
    AOS.init({ duration: 500, once: true, easing: 'ease-out' });
  }, []);

  const summary = useAdminDashboard();
  const recentEnrollments = useAdminEnrollments({ page: 1, limit: 50 });
  const recentPayments = useAdminPayments({ page: 1, limit: 50 });
  const followups = useFollowUps({ page: 1, limit: 50 });

  const enrollItems = recentEnrollments.data?.items ?? recentEnrollments.data?.data ?? recentEnrollments.data ?? [];
  const paymentItems = recentPayments.data?.items ?? recentPayments.data?.data ?? recentPayments.data ?? [];
  const followItems = followups.data?.items ?? followups.data?.data ?? followups.data ?? [];

  const days = useMemo(() => last7Days(), []);

  const enrollmentTrend = useMemo(() => {
    const map = new Map(days.map((d) => [dayKey(d), 0]));
    enrollItems.forEach((e) => {
      if (!e.createdAt) return;
      const k = dayKey(e.createdAt);
      if (map.has(k)) map.set(k, map.get(k) + 1);
    });
    return days.map((d) => ({
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2),
      value: map.get(dayKey(d)) || 0,
    }));
  }, [enrollItems, days]);

  const revenueTrend = useMemo(() => {
    const map = new Map(days.map((d) => [dayKey(d), 0]));
    paymentItems.forEach((p) => {
      if (p.status !== 'SUCCESS' || !p.createdAt) return;
      const k = dayKey(p.createdAt);
      if (map.has(k)) map.set(k, map.get(k) + (p.finalAmount ?? p.amount ?? 0));
    });
    return days.map((d) => ({
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2),
      value: map.get(dayKey(d)) || 0,
    }));
  }, [paymentItems, days]);

  const followStatusSlices = useMemo(() => {
    const counts = {};
    followItems.forEach((f) => {
      const k = f.status || 'NEW';
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, color: FOLLOW_UP_COLORS[label] || '#94a3b8' }));
  }, [followItems]);

  const paymentStatusSlices = useMemo(() => {
    const counts = {};
    paymentItems.forEach((p) => {
      const k = p.status || 'CREATED';
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, color: PAYMENT_COLORS[label] || '#94a3b8' }));
  }, [paymentItems]);

  const successCount = paymentStatusSlices.find((s) => s.label === 'SUCCESS')?.value ?? 0;
  const conversionRate = enrollItems.length
    ? Math.round((successCount / enrollItems.length) * 100)
    : 0;

  const totalRevenue7d = revenueTrend.reduce((s, d) => s + d.value, 0);
  const totalEnroll7d = enrollmentTrend.reduce((s, d) => s + d.value, 0);

  const upcomingFollowUps = useMemo(() => {
    const now = Date.now();
    return [...followItems]
      .filter((f) => f.nextFollowUpAt && new Date(f.nextFollowUpAt).getTime() >= now - 86400000)
      .sort((a, b) => new Date(a.nextFollowUpAt) - new Date(b.nextFollowUpAt))
      .slice(0, 5);
  }, [followItems]);

  const recentEnroll5 = useMemo(() => enrollItems.slice(0, 5), [enrollItems]);
  const recentPay5 = useMemo(() => paymentItems.slice(0, 5), [paymentItems]);

  const refreshAll = () => {
    summary.refetch?.();
    recentEnrollments.refetch?.();
    recentPayments.refetch?.();
    followups.refetch?.();
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const anyError =
    summary.error || recentEnrollments.error || recentPayments.error || followups.error;
  const anyLoading = summary.loading && !summary.data;

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="Dashboard"
        subtitle={`${today} · Overview of enrollments, payments and follow-ups`}
        action={
          <>
            <Link
              to="/admin/enrollments"
              className="inline-flex items-center justify-center h-9 px-4 rounded-[0.625rem] bg-brand-500 text-white text-[13px] font-medium shadow-sm hover:bg-brand-600 hover:shadow-md transition-all duration-150"
            >
              View enrollments
            </Link>
            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex items-center justify-center h-9 px-4 rounded-[0.625rem] border bg-white text-slate-700 text-[13px] font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors duration-150"
              style={{ borderColor: 'var(--admin-border, #E5E7EB)' }}
            >
              ↻ Refresh
            </button>
          </>
        }
      />

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {anyError && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {anyError.message}
        </div>
      )}

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      {anyLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-stretch">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-full"><StatCardSkeleton /></div>
          ))}
        </div>
      ) : (
        // items-stretch (grid default) makes the rows take the tallest
        // child's height; the per-cell `h-full` on each AOS wrapper is
        // what lets the StatCard inside fill that height. Without the
        // h-full on the wrapper, the StatCard collapses to its content.
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-stretch">
          <div className="h-full" data-aos="fade-up" data-aos-delay="0">
            <StatCard
              label="Today's enrollments"
              value={fmtNum(summary.data?.today?.enrollments)}
              hint="UTC day"
              accentClass="from-brand-500 to-brand-700"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5m6 0v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 0H9" />
                </svg>
              }
            />
          </div>
          <div className="h-full" data-aos="fade-up" data-aos-delay="60">
            <StatCard
              label="Today's revenue"
              value={inr(summary.data?.today?.revenuePaise)}
              hint="UTC day"
              accentClass="from-emerald-500 to-emerald-700"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
          <div className="h-full" data-aos="fade-up" data-aos-delay="120">
            <StatCard
              label="Pending payments"
              value={fmtNum(summary.data?.pending?.payments)}
              accentClass="from-amber-500 to-orange-500"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
          <div className="h-full" data-aos="fade-up" data-aos-delay="180">
            <StatCard
              label="Pending follow-ups"
              value={fmtNum(summary.data?.pending?.followUps)}
              accentClass="from-rose-500 to-pink-600"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.5 10.5a11.037 11.037 0 004.999 5l1.113-1.724a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            />
          </div>
          <div className="h-full" data-aos="fade-up" data-aos-delay="240">
            <StatCard
              label="Revenue (7d)"
              value={inr(totalRevenue7d)}
              hint="from recent payments"
              accentClass="from-violet-500 to-purple-600"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
          </div>
          <div className="h-full" data-aos="fade-up" data-aos-delay="300">
            <StatCard
              label="Conversion rate"
              value={`${conversionRate}%`}
              hint={`${successCount} paid / ${enrollItems.length} recent`}
              accentClass="from-slate-500 to-slate-700"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        </div>
      )}

      {/* ── Trend charts ─────────────────────────────────────────────────── */}
      {anyLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Enrollments — last 7 days</h3>
              <span className="text-xs text-slate-500">{totalEnroll7d} total</span>
            </div>
            <MiniBarChart data={enrollmentTrend} color="#2563EB" />
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Revenue — last 7 days</h3>
              <span className="text-xs text-slate-500">{inr(totalRevenue7d)}</span>
            </div>
            <MiniBarChart data={revenueTrend} color="#10b981" format={inr} />
          </Card>
        </div>
      )}

      {/* ── Donut charts ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Follow-ups by status</h3>
            <Link to="/admin/follow-ups" className="text-xs text-brand-600 hover:text-brand-800 hover:underline font-medium">
              View all →
            </Link>
          </div>
          <Donut slices={followStatusSlices} />
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Payments by status</h3>
            <Link to="/admin/payments" className="text-xs text-brand-600 hover:text-brand-800 hover:underline font-medium">
              View all →
            </Link>
          </div>
          <Donut slices={paymentStatusSlices} />
        </Card>
      </div>

      {/* ── Activity panels ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Recent enrollments */}
        <Card>
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Recent enrollments</h3>
            <Link to="/admin/enrollments" className="text-xs text-brand-600 hover:text-brand-800 hover:underline font-medium">
              All →
            </Link>
          </div>
          {recentEnroll5.length === 0 ? (
            <div className="text-sm text-slate-400 py-6 text-center">No recent enrollments</div>
          ) : (
            <ul className="divide-y divide-slate-100 -mx-1">
              {recentEnroll5.map((e) => (
                <li key={e.id} className="px-1 py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {e.fullName || `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || 'Unknown'}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{e.email ?? e.phone ?? '—'}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusPill status={e.status ?? 'NEW'} color="#2563EB" />
                    <div className="text-[10px] text-slate-400 mt-1">
                      {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent payments */}
        <Card>
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Recent payments</h3>
            <Link to="/admin/payments" className="text-xs text-brand-600 hover:text-brand-800 hover:underline font-medium">
              All →
            </Link>
          </div>
          {recentPay5.length === 0 ? (
            <div className="text-sm text-slate-400 py-6 text-center">No recent payments</div>
          ) : (
            <ul className="divide-y divide-slate-100 -mx-1">
              {recentPay5.map((p) => (
                <li key={p.id} className="px-1 py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {p.enrollment?.fullName ?? p.enrollment?.email ?? '—'}
                    </div>
                    <div className="text-xs text-slate-500 font-mono truncate">
                      {p.razorpayPaymentId ?? p.razorpayOrderId ?? '—'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-slate-900">{inr(p.finalAmount ?? p.amount)}</div>
                    <StatusPill status={p.status} color={PAYMENT_COLORS[p.status] || '#64748b'} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Upcoming follow-ups */}
        <Card>
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Upcoming follow-ups</h3>
            <Link to="/admin/follow-ups" className="text-xs text-brand-600 hover:text-brand-800 hover:underline font-medium">
              All →
            </Link>
          </div>
          {upcomingFollowUps.length === 0 ? (
            <div className="text-sm text-slate-400 py-6 text-center">Nothing scheduled</div>
          ) : (
            <ul className="divide-y divide-slate-100 -mx-1">
              {upcomingFollowUps.map((f) => (
                <li key={f.id} className="px-1 py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {f.enrollment?.fullName ?? f.enrollment?.email ?? f.enrollmentId ?? '—'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(f.nextFollowUpAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusPill
                      status={f.status}
                      color={FOLLOW_UP_COLORS[f.status] || '#64748b'}
                    />
                    <div className="text-[10px] text-slate-400 mt-1">
                      {f.callAttempts ?? 0} call{(f.callAttempts ?? 0) === 1 ? '' : 's'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Quick-links grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-2">
        {[
          { to: '/admin/enrollments', label: 'Manage enrollments', sub: 'View, search & filter', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5m6 0v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 0H9" />
            </svg>
          ) },
          { to: '/admin/payments', label: 'Payments', sub: 'Review transactions', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          ) },
          { to: '/admin/payments?tab=failed', label: 'Failed payments', sub: 'Investigate failures', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) },
          { to: '/admin/follow-ups', label: 'Follow-ups', sub: 'Track outreach', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.5 10.5a11.037 11.037 0 004.999 5l1.113-1.724a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          ) },
        ].map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border hover:shadow-card-hover transition-all duration-200 shadow-card"
            style={{ borderColor: 'var(--admin-border, #E5E7EB)' }}
          >
            <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              {q.icon}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-slate-900 truncate">{q.label}</div>
              <div className="text-[12px] text-slate-500 truncate">{q.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
