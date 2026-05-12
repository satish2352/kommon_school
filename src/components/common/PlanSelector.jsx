/**
 * PlanSelector — 3-card plan selector with duration tabs.
 *
 * Props:
 *   plans           — array of Plan objects from listPublic() (each has .pricings[])
 *   value           — currently selected planPricingId (integer or null)
 *   onChange        — (planPricingId, pricingSummary) => void
 *   defaultDuration — initial duration in months (default 6)
 *   onCompare       — () => void  — called when user clicks "Compare features"
 */

import { useState } from 'react';

const DURATION_TABS = [
  { months: 1,  label: '1 Month' },
  { months: 3,  label: '3 Months' },
  { months: 6,  label: '6 Months' },
  { months: 12, label: '12 Months' },
];

const TIER_STYLES = {
  SILVER: {
    card:     'border-slate-200 hover:border-slate-400',
    selected: 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-300',
    badge:    'bg-slate-100 text-slate-600',
    price:    'text-slate-900',
  },
  GOLD: {
    card:     'border-amber-200 hover:border-amber-400',
    selected: 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-300',
    badge:    'bg-amber-100 text-amber-700',
    price:    'text-amber-900',
  },
  PLATINUM: {
    card:     'border-violet-200 hover:border-violet-400',
    selected: 'border-violet-500 bg-violet-50/30 ring-2 ring-violet-300',
    badge:    'bg-violet-100 text-violet-700',
    price:    'text-violet-900',
  },
};

const inr = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function PlanSelector({ plans = [], value, onChange, defaultDuration = 6, onCompare }) {
  const [duration, setDuration] = useState(defaultDuration);

  // Find pricing for a given plan + selected duration
  function getPricing(plan) {
    return (plan.pricings ?? []).find(
      (p) => p.durationMonths === duration && p.status === 'ACTIVE',
    ) ?? null;
  }

  const orderedPlans = [...(plans ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      {/* ── Duration tabs ── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {DURATION_TABS.map((tab) => (
          <button
            key={tab.months}
            type="button"
            onClick={() => setDuration(tab.months)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              duration === tab.months
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Plan cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {orderedPlans.map((plan) => {
          const pricing = getPricing(plan);
          const style   = TIER_STYLES[plan.tier] ?? TIER_STYLES.SILVER;
          const isSelected = pricing && value === pricing.id;

          return (
            <button
              key={plan.id}
              type="button"
              disabled={!pricing}
              onClick={() => {
                if (!pricing) return;
                onChange(pricing.id, {
                  planId:          plan.id,
                  planName:        plan.name,
                  tier:            plan.tier,
                  durationMonths:  pricing.durationMonths,
                  basePrice:       Number(pricing.basePrice),
                  discountPercent: Number(pricing.discountPercent),
                  finalPrice:      Number(pricing.finalPrice),
                  discountLabel:   pricing.discountLabel ?? null,
                });
              }}
              className={`relative flex flex-col text-left p-4 rounded-xl border-2 transition-all duration-150 w-full
                ${!pricing ? 'opacity-40 cursor-not-allowed border-slate-200' : ''}
                ${pricing && isSelected ? style.selected : ''}
                ${pricing && !isSelected ? style.card + ' bg-white' : ''}
              `}
            >
              {/* Highlight ribbon */}
              {plan.highlightLabel && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white whitespace-nowrap shadow-sm">
                  {plan.highlightLabel}
                </span>
              )}

              {/* Tier badge */}
              <span className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-[10px] font-bold mb-2 ${style.badge}`}>
                {plan.tier}
              </span>

              {/* Name + tagline */}
              <div className="font-bold text-slate-900 text-sm">{plan.name}</div>
              {plan.tagline && (
                <div className="text-xs text-slate-400 mt-0.5">{plan.tagline}</div>
              )}

              {/* Price */}
              {pricing ? (
                <div className="mt-3">
                  <div className={`text-xl font-bold ${style.price}`}>{inr(pricing.finalPrice)}</div>
                  {pricing.discountLabel && (
                    <div className="text-xs text-emerald-600 font-semibold mt-0.5">{pricing.discountLabel}</div>
                  )}
                  {pricing.discountPercent > 0 && (
                    <div className="text-xs text-slate-400 line-through">{inr(pricing.basePrice)}</div>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-400">Not available</div>
              )}

              {/* Features */}
              <ul className="mt-3 space-y-1.5">
                {(Array.isArray(plan.features) ? plan.features : []).slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
                {(Array.isArray(plan.features) ? plan.features : []).length > 4 && (
                  <li className="text-xs text-slate-400">
                    +{plan.features.length - 4} more
                  </li>
                )}
              </ul>

              {/* Selected indicator */}
              {isSelected && (
                <div className="mt-3 pt-2 border-t border-indigo-200 flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Selected
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Compare link ── */}
      {onCompare && (
        <div className="text-center">
          <button
            type="button"
            onClick={onCompare}
            className="text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors"
          >
            Compare all features
          </button>
        </div>
      )}
    </div>
  );
}
