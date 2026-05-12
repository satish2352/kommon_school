/**
 * PlanSummaryCard — compact summary of the selected plan + pricing.
 * Used inside PaymentFlow.jsx on the 'ready' phase.
 *
 * Props:
 *   plan — { tier, name, durationMonths, finalPrice, discountPercent, discountLabel }
 */

const TIER_COLORS = {
  SILVER:   'bg-slate-100 text-slate-700 border-slate-200',
  GOLD:     'bg-amber-50 text-amber-700 border-amber-200',
  PLATINUM: 'bg-violet-50 text-violet-700 border-violet-200',
};

const inr = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function PlanSummaryCard({ plan }) {
  if (!plan) return null;

  const tierStyle = TIER_COLORS[plan.tier] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div className={`mb-4 p-3 rounded-xl border ${tierStyle}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide opacity-70">{plan.tier}</span>
            <span className="font-semibold text-sm">{plan.name} Plan</span>
          </div>
          <div className="text-xs opacity-60 mt-0.5">
            {plan.durationMonths === 1 ? '1 Month' : `${plan.durationMonths} Months`}
            {plan.discountLabel ? ` · ${plan.discountLabel}` : ''}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-base">{inr(plan.finalPrice)}</div>
          {plan.discountPercent > 0 && (
            <div className="text-xs opacity-60 line-through">{inr(plan.basePrice)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
