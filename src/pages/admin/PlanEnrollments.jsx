import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plansAdminService } from '../../services/plansAdminService';
import {
  PageHeader,
  Card,
  Button,
  Table,
  Th,
  Td,
  Tr,
  Pagination,
  Skeleton,
  EmptyState,
} from '../../components/admin';

/* ─── Status badge ───────────────────────────────────────────────────────── */
const STATUS_STYLES = {
  submitted:       'bg-slate-100 text-slate-600',
  payment_pending: 'bg-amber-100 text-amber-700',
  paid:            'bg-emerald-100 text-emerald-700',
  sync_pending:    'bg-blue-100 text-blue-700',
  completed:       'bg-emerald-100 text-emerald-700',
  failed:          'bg-red-100 text-red-700',
  expired:         'bg-red-100 text-red-700',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

/* ─── Skeleton rows ──────────────────────────────────────────────────────── */
const COL_COUNT = 8;

function SkeletonRows({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Tr key={i} striped={i % 2 === 1}>
          <Td><Skeleton w="w-28" /></Td>
          <Td><Skeleton w="w-24" /></Td>
          <Td><Skeleton w="w-32" /></Td>
          <Td><Skeleton w="w-24" /></Td>
          <Td><Skeleton w="w-16" /></Td>
          <Td><Skeleton w="w-20" /></Td>
          <Td><Skeleton w="w-20" /></Td>
          <Td><Skeleton w="w-24" /></Td>
        </Tr>
      ))}
    </>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function PlanEnrollments() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [plan, setPlan]       = useState(null);
  const [records, setRecords] = useState([]);
  const [meta, setMeta]       = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [page, setPage]       = useState(1);
  const [limit, setLimit]     = useState(20);

  /* ── Load plan metadata ── */
  useEffect(() => {
    plansAdminService.getById(id).then(setPlan).catch(() => {});
  }, [id]);

  /* ── Load enrollments ── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    plansAdminService
      .listEnrollments(id, { page, limit })
      .then(({ records: rows, meta: m }) => {
        if (!cancelled) { setRecords(rows); setMeta(m); }
      })
      .catch((err) => { if (!cancelled) setError(err.message ?? 'Failed to load enrollments'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, page, limit]);

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <PageHeader
        title={plan ? `${plan.name} Enrollments` : 'Plan Enrollments'}
        subtitle={plan ? `${plan.tier} — ${plan.tagline ?? ''}` : `Plan ID: ${id}`}
        action={
          <Button variant="secondary" onClick={() => navigate('/admin/plans')}>
            Back to Plans
          </Button>
        }
      />

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Card variant="flush">
        <Table>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Enrollment Code', 'Name', 'Email', 'Phone', 'Duration', 'Final Price', 'Status', 'Created'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <SkeletonRows />}

            {!loading && !error && records.length === 0 && (
              <EmptyState
                colSpan={COL_COUNT}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5m6 0v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 0H9" />
                  </svg>
                }
                title="No enrollments yet"
                description="No enrollments have been made for this plan."
              />
            )}

            {!loading && !error && records.map((rec, idx) => {
              const pricing = rec.plan_pricing;
              const durationMonths = pricing?.durationMonths ?? null;
              const finalPrice = pricing?.finalPrice != null
                ? `₹${Number(pricing.finalPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                : '—';
              return (
                <Tr key={rec.id} striped={idx % 2 === 1}>
                  <Td className="font-mono text-xs text-slate-700">
                    {rec.enrollment_code ?? rec.id.slice(0, 8) + '…'}
                  </Td>
                  <Td className="text-slate-900 font-medium">
                    {rec.name || [rec.first_name, rec.last_name].filter(Boolean).join(' ') || '—'}
                  </Td>
                  <Td className="text-slate-600 text-sm">{rec.email}</Td>
                  <Td className="text-slate-500 text-sm">{rec.phone_number ?? '—'}</Td>
                  <Td className="text-slate-600 text-sm whitespace-nowrap">
                    {durationMonths != null ? `${durationMonths} mo` : '—'}
                  </Td>
                  <Td className="text-slate-700 text-sm whitespace-nowrap">{finalPrice}</Td>
                  <Td><StatusBadge status={rec.status} /></Td>
                  <Td className="text-slate-500 text-xs">{formatDate(rec.created_at)}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <Pagination
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(v) => { setLimit(Number(v)); setPage(1); }}
      />
    </div>
  );
}
