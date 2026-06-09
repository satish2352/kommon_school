import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Table,
  Th,
  Td,
  Tr,
  Skeleton,
  EmptyState,
  Pagination,
} from '../../components/admin';

const PAGE_SIZE = 10;

/* ─── Status badge ───────────────────────────────────────────────────────── */
const STATUS_VARIANT = {
  PAID:            'success',
  COMPLETED:       'success',
  SYNC_PENDING:    'info',
  SUBMITTED:       'neutral',
  PAYMENT_PENDING: 'warning',
  FAILED:          'danger',
  EXPIRED:         'danger',
};

function StatusBadge({ status }) {
  const key = String(status ?? '').toUpperCase();
  return (
    <Badge variant={STATUS_VARIANT[key] ?? 'neutral'}>
      {status ? key.replace(/_/g, ' ') : '—'}
    </Badge>
  );
}

function formatMoney(paise) {
  if (paise == null) return '—';
  return `₹${(Number(paise) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* Colour + note for a days-left value. null → no active plan. */
function daysLeftMeta(d) {
  if (d == null)  return { text: 'text-slate-400', note: '—' };
  if (d <= 0)     return { text: 'text-red-600',     note: 'Expired' };
  if (d <= 7)     return { text: 'text-amber-600',   note: 'Expiring soon' };
  if (d <= 30)    return { text: 'text-emerald-600', note: 'Active' };
  return { text: 'text-emerald-600', note: 'Active' };
}

const COL_COUNT = 8;

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function StudentHistory() {
  const { email: emailParam } = useParams();
  const email = decodeURIComponent(emailParam ?? '');
  const navigate = useNavigate();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [copied, setCopied]   = useState(false);
  const [page, setPage]       = useState(1);

  // Shareable upgrade link: <host from env>/upgrade/<email>. Falls back to the
  // current origin when VITE_PUBLIC_SITE_URL isn't configured.
  const siteHost = (import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin).replace(/\/+$/, '');
  const upgradeUrl = `${siteHost}/upgrade/${encodeURIComponent(email)}`;
  const copyUpgradeLink = async () => {
    try {
      await navigator.clipboard.writeText(upgradeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this upgrade link:', upgradeUrl);
    }
  };

  // Reset to page 1 whenever the student (email) changes.
  useEffect(() => { setPage(1); }, [email]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminService
      .getEnrollmentsByEmail(email, { page, limit: PAGE_SIZE })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err.message ?? 'Failed to load history'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [email, page]);

  const items = data?.items ?? [];
  const total = Number(data?.total ?? 0);
  const totalPages = Math.max(1, Number(data?.totalPages ?? 1));
  const studentName = items.find((i) => i.fullName)?.fullName ?? null;
  // Current plan is resolved server-side independently of the page, so the
  // days-left summary stays correct even when viewing page 2+.
  const activePlan = data?.currentPlan ?? null;
  const activeMeta = activePlan ? daysLeftMeta(activePlan.daysLeft) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={studentName ? `${studentName} — Enrollment History` : 'Enrollment History'}
        subtitle={email}
        action={
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={copyUpgradeLink} title={upgradeUrl}>
              {copied ? '✓ Link copied' : 'Copy upgrade link'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/enrollments')}>
              Back to Enrollments
            </Button>
          </div>
        }
      />

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && activePlan && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Plan</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{activePlan.planLabel || '—'}</div>
              {activePlan.externalPlanId && (
                <div className="mt-0.5 font-mono text-xs text-indigo-600">Plan ID: {activePlan.externalPlanId}</div>
              )}
              <div className="mt-1 text-sm text-slate-500">
                {activePlan.durationLabel ? `${activePlan.durationLabel} · ` : ''}
                Started {formatDateShort(activePlan.planStartAt)} · Expires{' '}
                <span className="font-medium text-slate-700">{formatDateShort(activePlan.planExpiryAt)}</span>
              </div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-extrabold leading-none ${activeMeta.text}`}>
                {Math.max(0, activePlan.daysLeft)}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">days left</div>
              <div className={`mt-1 text-xs font-semibold ${activeMeta.text}`}>{activeMeta.note}</div>
            </div>
          </div>
        </Card>
      )}

      {!loading && !error && (
        <div className="text-sm text-slate-500">
          <span className="font-medium text-slate-700">{total}</span> enrollment{total === 1 ? '' : 's'} for this email
        </div>
      )}

      <Card variant="flush">
        <Table>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Enrollment Code', 'Name', 'Plan', 'Type', 'Amount', 'Status', 'Days Left', 'Created'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Tr key={i} striped={i % 2 === 1}>
                    {Array.from({ length: COL_COUNT }).map((__, j) => (
                      <Td key={j}><Skeleton w="w-24" /></Td>
                    ))}
                  </Tr>
                ))}
              </>
            )}

            {!loading && !error && items.length === 0 && (
              <EmptyState
                colSpan={COL_COUNT}
                title="No enrollments"
                description="No enrollments found for this email."
              />
            )}

            {!loading && !error && items.map((it, idx) => (
              <Tr key={it.id} striped={idx % 2 === 1}>
                <Td className="font-mono text-xs text-slate-700">{it.enrollmentId}</Td>
                <Td className="text-slate-900 font-medium">{it.fullName || '—'}</Td>
                <Td className="text-slate-600 text-sm">
                  {it.planLabel || '—'}
                  {it.externalPlanId && (
                    <div className="font-mono text-[11px] text-slate-400">{it.externalPlanId}</div>
                  )}
                </Td>
                <Td>
                  <Badge variant={it.candidateType === 'INTERNAL' ? 'info' : 'neutral'}>
                    {it.candidateType || 'EXTERNAL'}
                  </Badge>
                </Td>
                <Td className="text-slate-700 text-sm whitespace-nowrap">{formatMoney(it.amountPaise)}</Td>
                <Td><StatusBadge status={it.status} /></Td>
                <Td className="whitespace-nowrap">
                  {it.daysLeft == null ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <div>
                      <span className={`text-sm font-semibold ${daysLeftMeta(it.daysLeft).text}`}>
                        {it.daysLeft > 0 ? `${it.daysLeft} day${it.daysLeft === 1 ? '' : 's'}` : 'Expired'}
                      </span>
                      <div className="text-xs text-slate-400">exp {formatDateShort(it.planExpiryAt)}</div>
                    </div>
                  )}
                </Td>
                <Td className="text-slate-500 text-xs whitespace-nowrap">{formatDate(it.createdAt)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {!loading && !error && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
