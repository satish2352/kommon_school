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

import { useState, useMemo } from 'react';
import { getDurationTabs, pricingKey, defaultDurationKey } from '../../utils/planDurations';

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

/**
 * PlanFeatures
 * ------------
 * Renders the features bullet list inside a plan card with an inline
 * "+N more" expand/collapse toggle.
 *
 * Why this isn't a regular <button>:
 *   The parent plan card is itself a <button> (clicking the card selects
 *   the plan), and HTML5 forbids nesting interactive elements. Using a
 *   real <button> here would (a) emit invalid markup, (b) double-trigger
 *   the plan-select on click via event bubbling. Instead we use a
 *   <span role="button" tabIndex={0}> with explicit stopPropagation on
 *   both click and keyboard activation, so the toggle stays keyboard-
 *   reachable but doesn't ripple into the parent's onClick.
 *
 * State is local — each card manages its own showAll independently.
 */
function PlanFeatures({ features }) {
  const [showAll, setShowAll] = useState(false);
  const list      = Array.isArray(features) ? features : [];
  const LIMIT     = 4;
  const visible   = showAll ? list : list.slice(0, LIMIT);
  const hidden    = Math.max(0, list.length - LIMIT);

  const toggle = (e) => {
    // Prevent the parent <button> (the card) from receiving this click
    // and selecting the plan as a side effect of expanding features.
    e.stopPropagation();
    setShowAll((v) => !v);
  };
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setShowAll((v) => !v);
    }
  };

  return (
    <ul className="mt-3 space-y-1.5">
      {visible.map((f, i) => (
        <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
          <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {f}
        </li>
      ))}
      {hidden > 0 && (
        <li>
          <span
            role="button"
            tabIndex={0}
            aria-expanded={showAll}
            onClick={toggle}
            onKeyDown={onKey}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors select-none"
          >
            <span>
              {showAll ? 'Show less' : `+${hidden} more`}
            </span>
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </li>
      )}
    </ul>
  );
}

// Default to the 1-month plan so new users see the entry-level price first.
// Mirrors the Pricing Page default so the two surfaces feel consistent.
// Callers may still override via the `defaultDuration` prop (e.g. when a
// preselected plan from the Pricing Page has a specific duration).
export default function PlanSelector({ plans = [], value, onChange, defaultDuration = 1, onCompare }) {
  // User's picked duration ("value-unit" key); null until they tap a tab.
  const [duration, setDuration] = useState(null);

  // Duration tabs derived from the admin-configured pricing rows passed in,
  // so the strip reflects whatever durations staff published (any value,
  // Days or Months) rather than a hardcoded list.
  const durationTabs = useMemo(() => getDurationTabs(plans), [plans]);

  // Effective selection, derived during render: the user's pick when still
  // valid, otherwise the caller's defaultDuration (in MONTHS) or the
  // shortest available tab.
  const activeDuration = durationTabs.some((t) => t.key === duration)
    ? duration
    : defaultDurationKey(durationTabs, defaultDuration);

  // Find pricing for a given plan + selected duration
  function getPricing(plan) {
    return (plan.pricings ?? []).find(
      (p) => pricingKey(p) === activeDuration && p.status === 'ACTIVE',
    ) ?? null;
  }

  const orderedPlans = [...(plans ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  // Only the plans with an ACTIVE pricing at this duration — no greyed-out
  // "Not available" cards.
  const visiblePlans = orderedPlans
    .map((plan) => ({ plan, pricing: getPricing(plan) }))
    .filter((x) => x.pricing);

  // Centre one or two plans; otherwise use the 3-up grid.
  const gridLayoutClass =
    visiblePlans.length === 1
      ? 'grid-cols-1 max-w-xs mx-auto'
      : visiblePlans.length === 2
      ? 'grid-cols-1 sm:grid-cols-2 max-w-lg mx-auto'
      : 'grid-cols-1 md:grid-cols-3';

  return (
    <div className="space-y-4">
      {/* Header (heading + 3-step indicator) lives in the parent modal's
          sticky header now — see EnrollModal.jsx. Keeping it here would
          duplicate the same content twice in the same viewport. */}

      {/* ── Duration tabs — polished to match the Pricing Page treatment:
            active tab gets a white pill with shadow + slight scale + ring,
            inactive tabs hover-affordant only when their duration has a
            plan, disabled when no plan exists at that duration. Larger
            touch targets via py-2 so mobile taps are comfortable. ── */}
      <div
        role="tablist"
        aria-label="Choose plan duration"
        className="flex gap-1 bg-slate-100 rounded-xl p-1.5 shadow-inner"
      >
        {durationTabs.map((tab) => {
          const isActive = activeDuration === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setDuration(tab.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-md scale-[1.02] ring-1 ring-indigo-100'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Plan cards — key={duration} forces a remount on tab change so
            the existing `animate-fade-in` keyframe smoothly transitions
            the new prices in without an animation library. ── */}
      <div key={activeDuration} className={`grid ${gridLayoutClass} gap-3 animate-fade-in`}>
        {visiblePlans.map(({ plan, pricing }) => {
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
                  durationUnit:    pricing.durationUnit ?? 'MONTHS',
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

              {/* Features — collapsible "+N more" toggle handled by the
                  PlanFeatures sub-component so each card has its own
                  showAll state. */}
              <PlanFeatures features={plan.features} />

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
