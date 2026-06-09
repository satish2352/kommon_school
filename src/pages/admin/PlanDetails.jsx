import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plansAdminService } from '../../services/plansAdminService';
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
} from '../../components/admin';
import { formatDuration } from '../../utils/formatDuration';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const TIER_VARIANT = {
  SILVER:   'neutral',
  GOLD:     'warning',
  PLATINUM: 'info',
};

const STATUS_VARIANT = {
  ACTIVE:   'success',
  INACTIVE: 'danger',
};

function formatPrice(n) {
  if (n == null || n === '') return '—';
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/* ─── Detail field ───────────────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{children ?? '—'}</dd>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function PlanDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [plan, setPlan]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    plansAdminService
      .getById(id)
      .then((p) => { if (!cancelled) setPlan(p); })
      .catch((err) => { if (!cancelled) setError(err.message ?? 'Failed to load plan'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const pricings = (plan?.pricings ?? [])
    .slice()
    .sort((a, b) => (a.durationMonths ?? 0) - (b.durationMonths ?? 0));
  const features = Array.isArray(plan?.features) ? plan.features : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={plan ? plan.name : 'Plan Details'}
        subtitle={plan ? `${plan.tier} plan` : `Plan ID: ${id}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/admin/plans')}>
              Back to Plans
            </Button>
            {plan && (
              <Button variant="primary" onClick={() => navigate(`/admin/plans/${id}`)}>
                Edit Plan
              </Button>
            )}
          </div>
        }
      />

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <Card>
          <div className="space-y-3">
            <Skeleton w="w-48" />
            <Skeleton w="w-64" />
            <Skeleton w="w-40" />
          </div>
        </Card>
      )}

      {!loading && !error && plan && (
        <>
          {/* ── Overview ── */}
          <Card title="Overview">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label="Plan ID">#{plan.id}</Field>
              <Field label="Name">{plan.name}</Field>
              <Field label="Tier">
                <Badge variant={TIER_VARIANT[plan.tier] ?? 'neutral'}>{plan.tier}</Badge>
              </Field>
              <Field label="Status">
                <Badge variant={STATUS_VARIANT[plan.status] ?? 'neutral'}>{plan.status}</Badge>
              </Field>
              <Field label="System Default">
                <Badge variant={plan.isSystemDefault ? 'info' : 'neutral'}>
                  {plan.isSystemDefault ? 'Yes' : 'No'}
                </Badge>
              </Field>
              <Field label="Sort Order">{plan.sortOrder ?? 0}</Field>
              <Field label="Tagline">{plan.tagline || '—'}</Field>
              <Field label="Highlight Label">{plan.highlightLabel || '—'}</Field>
              <Field label="Pricing Rows">{pricings.length}</Field>
              <Field label="Created">{formatDateTime(plan.createdAt)}</Field>
              <Field label="Updated">{formatDateTime(plan.updatedAt)}</Field>
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Description">{plan.description || '—'}</Field>
              </div>
            </dl>
          </Card>

          {/* ── Features ── */}
          <Card title="Features">
            {features.length === 0 ? (
              <p className="text-sm text-slate-400">No features listed.</p>
            ) : (
              <ul className="space-y-2">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <svg className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ── Pricing ── */}
          <Card title="Pricing" variant="flush">
            <Table>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Duration', 'Base Price', 'Discount', 'Final Price', 'Discount Label', 'Plan ID', 'Status'].map((h) => (
                    <Th key={h}>{h}</Th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pricings.length === 0 && (
                  <EmptyState
                    colSpan={7}
                    title="No pricing configured"
                    description="This plan has no pricing rows yet."
                  />
                )}
                {pricings.map((p, idx) => (
                  <Tr key={p.id ?? idx} striped={idx % 2 === 1}>
                    <Td className="text-slate-700 text-sm whitespace-nowrap">
                      {formatDuration(p.durationMonths, p.durationUnit)}
                    </Td>
                    <Td className="text-slate-600 text-sm whitespace-nowrap">{formatPrice(p.basePrice)}</Td>
                    <Td className="text-slate-600 text-sm whitespace-nowrap">
                      {p.discountPercent != null ? `${p.discountPercent}%` : '—'}
                    </Td>
                    <Td className="text-slate-900 text-sm font-medium whitespace-nowrap">{formatPrice(p.finalPrice)}</Td>
                    <Td className="text-slate-500 text-sm">{p.discountLabel || '—'}</Td>
                    <Td className="font-mono text-xs text-slate-500">{p.externalPlanId || '—'}</Td>
                    <Td>
                      <Badge variant={STATUS_VARIANT[p.status] ?? 'neutral'}>{p.status}</Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
