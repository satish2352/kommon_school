import { useState, useEffect, useMemo } from 'react'
import { listPublic } from '../../services/plansService'
import { getDurationTabs, pricingKey, defaultDurationKey } from '../../utils/planDurations'

/**
 * PlanPicker
 * ----------
 * Reusable "Choose Your Duration & Plan" surface — the same duration-tab +
 * tier-card design as the public /pricing page (PricingTable), but decoupled
 * from the public EnrollModal. Clicking a plan's CTA calls
 * `onSelect(plan, pricing)`; the parent decides what to do (the panel starts a
 * self-service purchase + payment).
 *
 * Props:
 *   onSelect(plan, pricing) — called when the user clicks a plan's CTA
 *   busyPlanPricingId       — id of the pricing currently being processed
 *                             (shows a spinner + disables that card)
 *   ctaLabel                — CTA text (default "Get started")
 */

const DEFAULT_DURATION_MONTHS = 1

const TIER_CONFIG = {
  SILVER:   { badgeClass: 'bg-slate-100 text-slate-700',  priceClass: 'text-slate-900',  cardClass: 'border-slate-200 hover:border-slate-300' },
  GOLD:     { badgeClass: 'bg-amber-100 text-amber-700',  priceClass: 'text-amber-900',  cardClass: 'border-amber-200 hover:border-amber-300 ring-1 ring-amber-100' },
  PLATINUM: { badgeClass: 'bg-violet-100 text-violet-700', priceClass: 'text-violet-900', cardClass: 'border-violet-200 hover:border-violet-300' },
}

const inr = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function durationLabel(pricing) {
  const n = pricing?.durationMonths
  if (n == null) return ''
  const unit = String(pricing.durationUnit || 'MONTHS').toUpperCase() === 'DAYS'
    ? (n === 1 ? 'Day' : 'Days')
    : (n === 1 ? 'Month' : 'Months')
  return `${n} ${unit}`
}

function SkeletonGrid() {
  return (
    <>
      <div className="h-11 bg-slate-100 rounded-2xl mb-6 animate-pulse" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl p-6 border border-slate-200 bg-white animate-pulse min-h-[420px]">
            <div className="h-4 bg-slate-100 rounded w-20 mb-4" />
            <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-slate-100 rounded w-2/3 mb-6" />
            <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
            <div className="space-y-2 mb-8">{[0, 1, 2, 3].map((j) => <div key={j} className="h-3 bg-slate-100 rounded" />)}</div>
            <div className="h-10 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    </>
  )
}

function PlanCard({ plan, pricing, onSelect, busy, ctaLabel }) {
  const cfg = TIER_CONFIG[plan.tier] ?? TIER_CONFIG.SILVER
  const features = Array.isArray(plan.features) ? plan.features : []
  const [showAll, setShowAll] = useState(false)
  const COLLAPSED_LIMIT = 4
  const visibleFeatures = showAll ? features : features.slice(0, COLLAPSED_LIMIT)
  const hiddenCount = Math.max(0, features.length - COLLAPSED_LIMIT)
  const available = Boolean(pricing)
  const isBusy = busy && pricing && busy === pricing.id

  return (
    <div className={`relative rounded-2xl p-6 bg-white flex flex-col transition-all duration-200 border ${cfg.cardClass} ${available ? 'shadow-sm hover:shadow-xl hover:-translate-y-1' : 'opacity-60'}`}>
      {plan.highlightLabel && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-[11px] font-bold shadow-md whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #6161d5, #00127f)' }}>
          {plan.highlightLabel}
        </div>
      )}

      <span className={`inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mb-3 ${cfg.badgeClass}`}>
        {plan.tier}
      </span>

      <div className="font-bold text-lg text-slate-900">{plan.name}</div>
      {plan.tagline && <p className="text-xs text-slate-500 mt-1 mb-4">{plan.tagline}</p>}

      {available ? (
        <div className="mb-5">
          <div className={`text-3xl font-extrabold ${cfg.priceClass}`}>{inr(pricing.finalPrice)}</div>
          <div className="mt-1 text-[11px] text-slate-400">{durationLabel(pricing)}</div>
          {Number(pricing.discountPercent) > 0 && (
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-emerald-600 font-semibold">
                {pricing.discountLabel || `${Number(pricing.discountPercent).toFixed(2)}% off`}
              </span>
              <span className="text-slate-400 line-through">{inr(pricing.basePrice)}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-5 text-sm text-slate-400 italic">Not available for this duration</div>
      )}

      <ul className="flex-1 space-y-2 mb-3">
        {visibleFeatures.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
            <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="leading-relaxed">{f}</span>
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}
          className="self-start inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors pl-6">
          <span>{showAll ? 'Show less' : `+${hiddenCount} more ${hiddenCount === 1 ? 'feature' : 'features'}`}</span>
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      <div className="flex-1 mt-3" />

      <button
        type="button"
        disabled={!available || isBusy}
        onClick={() => onSelect(plan, pricing)}
        className={`w-full px-5 py-3 rounded-full font-bold text-sm transition-all duration-200 inline-flex items-center justify-center gap-2
                    ${available
                      ? 'btn-gradient-cta text-white shadow-md hover:scale-[1.02] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:scale-100'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
      >
        {isBusy && (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="4" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
        )}
        {available ? (isBusy ? 'Starting…' : (ctaLabel || 'Get started')) : 'Unavailable'}
      </button>
    </div>
  )
}

export default function PlanPicker({ onSelect, busyPlanPricingId = null, ctaLabel = 'Get started' }) {
  const [plans, setPlans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  // Selected duration as a "value-unit" key; null until plans load.
  const [duration, setDuration] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listPublic()
      .then((data) => { if (!cancelled) { setPlans(Array.isArray(data) ? data : []); setError(null); setLoading(false) } })
      .catch((err) => { if (!cancelled) { setError(err.message || 'Failed to load plans'); setLoading(false) } })
    return () => { cancelled = true }
  }, [retryKey])

  const orderedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [plans],
  )
  // Duration tabs derived from admin-configured pricing rows (any value,
  // Days or Months) — not a hardcoded list.
  const durationTabs = useMemo(() => getDurationTabs(plans), [plans])

  // Effective selection, derived during render: the user's pick when it's
  // still a valid tab, otherwise the default (1 month, or the shortest
  // available). Avoids an effect + keeps us off a removed duration.
  const activeDuration = durationTabs.some((t) => t.key === duration)
    ? duration
    : defaultDurationKey(durationTabs, DEFAULT_DURATION_MONTHS)

  // Only the plans that actually have an ACTIVE pricing at this duration, so
  // we never render greyed-out "Not available" cards.
  const visiblePlans = useMemo(
    () =>
      orderedPlans
        .map((plan) => ({
          plan,
          pricing:
            (plan.pricings ?? []).find(
              (p) => pricingKey(p) === activeDuration && p.status === 'ACTIVE',
            ) ?? null,
        }))
        .filter((x) => x.pricing),
    [orderedPlans, activeDuration],
  )

  // Centre one or two plans; otherwise use the full responsive 3-up grid.
  const gridLayoutClass =
    visiblePlans.length === 1
      ? 'grid-cols-1 max-w-sm mx-auto'
      : visiblePlans.length === 2
      ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
      : 'sm:grid-cols-2 lg:grid-cols-3'

  if (loading) return <SkeletonGrid />

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-slate-500 text-sm mb-3">{error}</p>
        <button onClick={() => { setLoading(true); setError(null); setRetryKey((k) => k + 1) }}
          className="px-5 py-2 rounded-full border border-[#6161d5] text-[#6161d5] text-sm font-semibold hover:bg-[#6161d5] hover:text-white transition-colors">
          Retry
        </button>
      </div>
    )
  }

  if (plans.length === 0) {
    return <div className="py-10 text-center text-slate-400 text-sm">No plans available right now. Please check back soon.</div>
  }

  return (
    <div>
      {/* Header + 3-step stepper */}
      <div className="max-w-2xl mx-auto mb-6 sm:mb-8 text-center px-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Choose Your Duration &amp; Plan</h2>
        <p className="text-slate-500 text-sm sm:text-[15px] flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          {['Select Duration', 'Choose Plan', 'Pay Securely'].map((label, i) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-300 hidden sm:inline mr-2">•</span>}
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold">{i + 1}</span>
              {label}
            </span>
          ))}
        </p>
      </div>

      {/* Duration tabs */}
      <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
        <div role="tablist" aria-label="Choose plan duration" className="flex gap-1 bg-slate-100 rounded-2xl p-1.5 shadow-inner">
          {durationTabs.map((tab) => {
            const isActive = activeDuration === tab.key
            return (
              <button key={tab.key} type="button" role="tab" aria-selected={isActive}
                onClick={() => setDuration(tab.key)}
                className={`flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200
                            ${isActive ? 'bg-white text-indigo-700 shadow-md scale-[1.02] ring-1 ring-indigo-100'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'}`}>
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tier cards */}
      <div key={activeDuration} className={`grid ${gridLayoutClass} gap-5 items-stretch animate-fade-in`}>
        {visiblePlans.map(({ plan, pricing }) => (
          <PlanCard key={plan.id} plan={plan} pricing={pricing} onSelect={onSelect} busy={busyPlanPricingId} ctaLabel={ctaLabel} />
        ))}
      </div>
    </div>
  )
}
