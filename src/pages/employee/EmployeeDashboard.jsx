import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeDashboardService } from '../../services/employeeDashboardService';
import {
  PageHeader,
  Card,
  Badge,
  Skeleton,
} from '../../components/admin';

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return '—'; }
};

/* ─── Metric tile ───────────────────────────────────────────────────────── */

/**
 * Tile component. `tone` drives the accent colour; `to` makes the whole
 * tile a link to a pre-filtered Leads view (so clicking "Interested"
 * lands the employee on /employee/leads filtered to interested leads).
 */
function Tile({ label, value, tone = 'slate', hint, to }) {
  const toneClasses = {
    slate:   { bg: 'bg-white border-slate-200',           accent: 'text-slate-900' },
    blue:    { bg: 'bg-blue-50/60 border-blue-200',       accent: 'text-blue-700' },
    amber:   { bg: 'bg-amber-50/60 border-amber-200',     accent: 'text-amber-700' },
    emerald: { bg: 'bg-emerald-50/60 border-emerald-200', accent: 'text-emerald-700' },
    rose:    { bg: 'bg-rose-50/60 border-rose-200',       accent: 'text-rose-700' },
    // Reserved for the Converted tile so it reads as a distinct, terminal
    // positive outcome — Interested already takes emerald.
    violet:  { bg: 'bg-violet-50/60 border-violet-200',   accent: 'text-violet-700' },
  };
  const t = toneClasses[tone] || toneClasses.slate;
  const inner = (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className={`text-3xl font-bold mt-2 ${t.accent} tabular-nums`}>
        {value ?? '—'}
      </div>
      {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
    </>
  );
  const className = `rounded-xl border p-5 transition-all ${t.bg} ${
    to ? 'hover:shadow-sm hover:-translate-y-[1px]' : ''
  }`;
  return to
    ? <Link to={to} className={`${className} block`}>{inner}</Link>
    : <div className={className}>{inner}</div>;
}

function TileSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <Skeleton w="w-20" />
      <div className="mt-3"><Skeleton w="w-12" /></div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function EmployeeDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    employeeDashboardService.get()
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e)  => { if (!cancelled) setError(e); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const m  = data?.metrics ?? {};
  const ra = Array.isArray(data?.recentActivity) ? data.recentActivity : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Your follow-up snapshot. Click any card to see the matching leads."
      />

      {/* ── Error state ─────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error.message || 'Failed to load dashboard.'}
        </div>
      )}

      {/* ── KPI tiles ──────────────────────────────────────────────────
          Simplified per product decision to 5 categories. Every tile is
          a link to the Leads page with the matching followupStatus query
          so clicking drills straight into the filtered list.
          --------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading ? (
          <>
            <TileSkeleton /><TileSkeleton /><TileSkeleton />
            <TileSkeleton /><TileSkeleton /><TileSkeleton />
          </>
        ) : (
          <>
            <Tile
              label="New leads"
              value={m.newLeads ?? 0}
              tone="blue"
              hint="No follow-up taken yet"
              to="/employee/leads?followupStatus=new"
            />
            <Tile
              label="Followed-up"
              value={m.followedUp ?? 0}
              tone="amber"
              hint="In progress"
              to="/employee/leads?followupStatus=contacted"
            />
            <Tile
              label="Interested"
              value={m.interested ?? 0}
              tone="emerald"
              hint="Showing interest"
              to="/employee/leads?followupStatus=interested"
            />
            <Tile
              label="Converted"
              value={m.converted ?? 0}
              tone="violet"
              hint="Closed-won"
              to="/employee/leads?followupStatus=converted"
            />
            <Tile
              label="Not interested"
              value={m.notInterested ?? 0}
              tone="rose"
              hint="Declined"
              to="/employee/leads?followupStatus=not_interested"
            />
            <Tile
              label="Closed"
              value={m.closed ?? 0}
              tone="slate"
              hint="Wrapped up"
              to="/employee/leads?followupStatus=closed"
            />
          </>
        )}
      </div>

      {/* ── Performance summary + recent activity (2-col on lg) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        {/* Performance */}
        <Card title="Performance">
          {loading ? (
            <div className="space-y-3">
              <Skeleton w="w-24" />
              <Skeleton w="w-16" />
            </div>
          ) : (
            <dl className="space-y-4 text-sm">
              <div className="flex items-baseline justify-between">
                <dt className="text-slate-600">Total assigned</dt>
                <dd className="text-2xl font-bold text-slate-900 tabular-nums">
                  {m.totalAssigned ?? 0}
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-slate-600">Converted</dt>
                <dd className="text-2xl font-bold text-emerald-700 tabular-nums">
                  {m.converted ?? 0}
                </dd>
              </div>
            </dl>
          )}
        </Card>

        {/* Recent activity */}
        <div className="lg:col-span-2">
          <Card title="Recent activity" subtitle="Your last 5 follow-up notes.">
            {loading ? (
              <div className="space-y-3">
                <Skeleton w="w-full" />
                <Skeleton w="w-full" />
                <Skeleton w="w-full" />
              </div>
            ) : ra.length === 0 ? (
              <div className="text-sm text-slate-400 italic py-2">
                No recent activity. Open a lead and record your first follow-up.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {ra.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant={entry.isSystem ? 'neutral' : 'info'}>
                          {entry.isSystem ? 'system' : 'note'}
                        </Badge>
                        {entry.enrollmentId ? (
                          <Link
                            to={`/employee/leads/${entry.enrollmentId}`}
                            className="text-sm text-slate-900 font-medium hover:text-emerald-700 hover:underline truncate"
                          >
                            {entry.leadName}
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-700 truncate">{entry.leadName}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {fmtDateTime(entry.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 pl-1">{entry.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
