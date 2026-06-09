import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useEnrollModal } from '../../context/EnrollModalContext'
import { listPublic } from '../../services/plansService'
import { getDurationTabs, pricingKey, defaultDurationKey } from '../../utils/planDurations'

/**
 * PricingTable
 * ------------
 * Public pricing surface. Renders a duration tab strip (1 / 3 / 6 / 12
 * months) above three tier cards (Silver / Gold / Platinum). Clicking
 * "Get started" on a card hands the chosen { planPricingId, summary } to
 * the EnrollModal via `openWithPlan(summary)` so the modal can skip its
 * in-modal plan-selection step and go straight to the Confirm screen.
 *
 * Security note: the price values rendered here come straight from
 * GET /api/v1/plans (DB) and are passed back to the backend by ID only.
 * The backend re-resolves price / discount / duration inside the
 * payment-order transaction so a user tampering with localStorage cannot
 * change what they get charged.
 */

// Default to the 1-month plan so first-time visitors see the entry-level
// price first, then can scale up via the tab strip. This reduces "sticker
// shock" on the longer-duration upfront-discount slabs. If no 1-month
// pricing exists, the first available (shortest) duration is selected.
const DEFAULT_DURATION_MONTHS = 1

// Tailwind breakpoint at which we start auto-scrolling the grid into view
// when the duration tab changes. We never scroll on >=sm because the
// tabs + grid are already both visible without scrolling.
const SM_BREAKPOINT_PX = 640

// Per-tier visual config. Keeps the markup driven by data rather than
// branching, which makes future tier additions a one-line change.
const TIER_CONFIG = {
  SILVER: {
    badgeClass: 'bg-slate-100 text-slate-700',
    accent:     'text-slate-900',
    cardClass:  'border-slate-200 hover:border-slate-300',
    priceClass: 'text-slate-900',
    btnClass:   'btn-gradient-cta text-white',
  },
  GOLD: {
    badgeClass: 'bg-amber-100 text-amber-700',
    accent:     'text-amber-700',
    cardClass:  'border-amber-200 hover:border-amber-300 ring-1 ring-amber-100',
    priceClass: 'text-amber-900',
    btnClass:   'btn-gradient-cta text-white',
  },
  PLATINUM: {
    badgeClass: 'bg-violet-100 text-violet-700',
    accent:     'text-violet-700',
    cardClass:  'border-violet-200 hover:border-violet-300',
    priceClass: 'text-violet-900',
    btnClass:   'btn-gradient-cta text-white',
  },
}

const inr = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

// ---------------------------------------------------------------------------
// Skeleton (loading) — keeps the layout stable so the page doesn't jump
// when the API responds.
// ---------------------------------------------------------------------------
function SkeletonGrid() {
  return (
    <>
      <div className="h-11 bg-slate-100 rounded-2xl mb-6 animate-pulse" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-6 border border-slate-200 bg-white animate-pulse min-h-[420px]"
          >
            <div className="h-4 bg-slate-100 rounded w-20 mb-4" />
            <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-slate-100 rounded w-2/3 mb-6" />
            <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/4 mb-6" />
            <div className="space-y-2 mb-8">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="h-3 bg-slate-100 rounded" />
              ))}
            </div>
            <div className="h-10 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// PlanCard — single tier for the currently-selected duration
// ---------------------------------------------------------------------------
function PlanCard({ plan, pricing, onGetStarted }) {
  const cfg = TIER_CONFIG[plan.tier] ?? TIER_CONFIG.SILVER
  const features = Array.isArray(plan.features) ? plan.features : []

  // Inline "Show all features" toggle. Collapsed state shows the first 4
  // bullets + a "+N more" button; expanded shows the full list + a
  // "Show less" button. Local to each card so toggling Gold doesn't
  // affect Silver / Platinum.
  //
  // Resets to collapsed automatically on duration-tab change because
  // the parent grid uses `key={duration}` and remounts every card.
  const [showAll, setShowAll] = useState(false)
  const COLLAPSED_LIMIT = 4
  const visibleFeatures = showAll ? features : features.slice(0, COLLAPSED_LIMIT)
  const hiddenCount = Math.max(0, features.length - COLLAPSED_LIMIT)

  // Pricing may be null when this plan has no active pricing at the
  // currently-selected duration (admin hasn't published it). We render
  // the card greyed-out rather than hiding it so the UI doesn't reflow
  // as the user tabs through durations.
  const available = Boolean(pricing)

  return (
    <div
      data-aos="fade-up"
      className={`relative rounded-2xl p-6 bg-white flex flex-col transition-all duration-200
                  border ${cfg.cardClass} ${available ? 'shadow-sm hover:shadow-xl hover:-translate-y-1' : 'opacity-60'}`}
    >
      {plan.highlightLabel && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-[11px] font-bold shadow-md whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #6161d5, #00127f)' }}
        >
          {plan.highlightLabel}
        </div>
      )}

      <span className={`inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mb-3 ${cfg.badgeClass}`}>
        {plan.tier}
      </span>

      <div className="font-bold text-lg text-slate-900">{plan.name}</div>
      {plan.tagline && (
        <p className="text-xs text-slate-500 mt-1 mb-4">{plan.tagline}</p>
      )}

      {available ? (
        <div className="mb-5">
          <div className={`text-3xl font-extrabold ${cfg.priceClass}`}>
            {inr(pricing.finalPrice)}
          </div>
          {Number(pricing.discountPercent) > 0 && (
            <div className="mt-1 flex items-center gap-2 text-xs">
              {/* Discount badge — prefer the admin-set discountLabel (it
                  may be marketing copy like "Student offer" or "Year-end
                  sale"); fall back to the computed "X% off" string when
                  no label is set. Showing both at once produces visible
                  duplicates when the admin literally typed "10% off" as
                  the label, so we pick exactly one. */}
              <span className="text-emerald-600 font-semibold">
                {pricing.discountLabel || `${Number(pricing.discountPercent).toFixed(2)}% off`}
              </span>
              <span className="text-slate-400 line-through">
                {inr(pricing.basePrice)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-5 text-sm text-slate-400 italic">
          Not available for this duration
        </div>
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

      {/* Inline expand/collapse toggle.
          Shown only when there are hidden features. Button — not a
          plain <span> — so it gets focus/keyboard support out of the
          box. aria-expanded + a chevron icon make the state obvious. */}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="self-start inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors pl-6"
        >
          <span>
            {showAll ? 'Show less' : `+${hiddenCount} more ${hiddenCount === 1 ? 'feature' : 'features'}`}
          </span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Always-present flex-1 spacer pins the "Get started" CTA to the
          bottom of the card so all three cards in the row line their
          buttons up regardless of how many features each one shows or
          whether the user has expanded one of them. */}
      <div className="flex-1 mt-3" />

      <button
        type="button"
        disabled={!available}
        onClick={() => onGetStarted(plan, pricing)}
        className={`w-full px-5 py-3 rounded-full font-bold text-sm transition-all duration-200
                    ${available
                      ? `${cfg.btnClass} shadow-md hover:scale-[1.02] hover:-translate-y-0.5`
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
      >
        {available ? 'Get started' : 'Unavailable'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export default function PricingTable() {
  const { openWithPlan } = useEnrollModal()
  const [plans, setPlans]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  // Selected duration as a "value-unit" key (e.g. "3-MONTHS"); null until
  // plans load and the default is resolved from the available tabs.
  const [duration, setDuration] = useState(null)
  // Ref to the cards grid so we can scroll it into view on mobile after a
  // tab change. Skipping the very first render avoids hijacking the user's
  // initial scroll position when they first land on the page.
  const gridRef = useRef(null)
  const firstRenderRef = useRef(true)

  // Duration tabs derived from the admin-configured pricing rows, so the
  // strip reflects whatever durations (any value, Days or Months) staff have
  // published — not a hardcoded list.
  const durationTabs = useMemo(() => getDurationTabs(plans), [plans])

  // Effective selection, derived during render: the user's pick when it's
  // still a valid tab, otherwise the default (1 month / shortest available).
  // No effect needed, and we never stay pointed at a removed duration.
  const activeDuration = durationTabs.some((t) => t.key === duration)
    ? duration
    : defaultDurationKey(durationTabs, DEFAULT_DURATION_MONTHS)

  // Auto-scroll the cards grid into view on small viewports when the
  // selected duration changes. Desktop always shows both tabs + cards in
  // the same viewport, so we'd just cause a distracting jump there.
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      return
    }
    if (typeof window === 'undefined') return
    if (window.innerWidth >= SM_BREAKPOINT_PX) return
    if (!gridRef.current) return
    // requestAnimationFrame defers the scroll until after the new prices
    // have rendered, so the user lands on the updated grid (not the stale
    // one from the previous tab).
    requestAnimationFrame(() => {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [activeDuration])

  useEffect(() => {
    let cancelled = false
    listPublic()
      .then((data) => {
        if (!cancelled) {
          setPlans(Array.isArray(data) ? data : [])
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load plans')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [retryKey])

  // Stable ordering by sortOrder so card positions don't shuffle when
  // the API returns plans in a different order. Memoised so we don't
  // re-sort on every duration tab click.
  const orderedPlans = useMemo(() => {
    return [...plans].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [plans])

  // Only the plans that actually have an ACTIVE pricing at the selected
  // duration — so we never render greyed-out "Not available" cards.
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

  // Centre the group when only one or two plans are offered at this duration;
  // fall back to the full responsive 3-up grid otherwise.
  const gridLayoutClass =
    visiblePlans.length === 1
      ? 'grid-cols-1 max-w-sm mx-auto'
      : visiblePlans.length === 2
      ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
      : 'sm:grid-cols-2 lg:grid-cols-3'

  // Hand the chosen plan to the EnrollModal. The summary contains
  // display-only pricing (the backend re-resolves it from DB on
  // payment-order); planPricingId is the only authoritative reference.
  function handleGetStarted(plan, pricing) {
    openWithPlan({
      planPricingId:   pricing.id,
      planId:          plan.id,
      planName:        plan.name,
      tier:            plan.tier,
      durationMonths:  pricing.durationMonths,
      durationUnit:    pricing.durationUnit ?? 'MONTHS',
      basePrice:       Number(pricing.basePrice),
      discountPercent: Number(pricing.discountPercent),
      finalPrice:      Number(pricing.finalPrice),
      discountLabel:   pricing.discountLabel ?? null,
    })
  }

  return (
    <div>
      {loading && <SkeletonGrid />}

      {!loading && error && (
        <div className="py-10 text-center">
          <p className="text-slate-500 text-sm mb-3">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); setRetryKey((k) => k + 1) }}
            className="px-5 py-2 rounded-full border border-[#6161d5] text-[#6161d5] text-sm font-semibold hover:bg-[#6161d5] hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && plans.length === 0 && (
        <div className="py-10 text-center text-slate-400 text-sm">
          No plans available right now. Please check back soon.
        </div>
      )}

      {!loading && !error && plans.length > 0 && (
        <>
          {/* ── Section header — explains the 3-step flow up-front so the
                visitor doesn't have to infer from the chrome. The stepper
                line uses bullet separators on desktop and stacks on
                mobile via flex-wrap, so it's readable at all widths. ── */}
          <div className="max-w-2xl mx-auto mb-6 sm:mb-8 text-center px-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Choose Your Duration &amp; Plan
            </h2>
            <p className="text-slate-500 text-sm sm:text-[15px] flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold">1</span>
                Select Duration
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold">2</span>
                Choose Plan
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold">3</span>
                Continue Enrollment
              </span>
            </p>
          </div>

          {/* ── Duration tab strip — sticky-bordered pill group. Highlighted
                tab uses solid white + indigo accent so it pops against the
                slate-100 backdrop. Inactive tabs are hover-affordant only
                when their duration actually has a plan. ── */}
          <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            <div
              role="tablist"
              aria-label="Choose plan duration"
              className="flex gap-1 bg-slate-100 rounded-2xl p-1.5 shadow-inner"
            >
              {durationTabs.map((tab) => {
                const isActive = activeDuration === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls="plans-grid"
                    onClick={() => setDuration(tab.key)}
                    className={`flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200
                                ${isActive
                                  ? 'bg-white text-indigo-700 shadow-md scale-[1.02] ring-1 ring-indigo-100'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'}`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Tier cards for the selected duration.
                The `key={duration}` on the grid forces React to remount the
                children on every tab change — combined with the fade-in
                animation class, that produces a smooth price-change
                transition without an animation library.
                The `scroll-mt-24` keeps the grid clear of the sticky nav
                when scrollIntoView lands here on mobile. ── */}
          <div
            ref={gridRef}
            id="plans-grid"
            className="scroll-mt-24 sm:scroll-mt-0"
          >
            <div
              key={activeDuration}
              className={`grid ${gridLayoutClass} gap-5 items-stretch animate-fade-in`}
            >
              {visiblePlans.map(({ plan, pricing }) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  pricing={pricing}
                  onGetStarted={handleGetStarted}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Trust strip — kept from the original layout */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-slate-400 text-xs">
        {[
          { icon: '🔒', text: 'Secure Razorpay payments' },
          { icon: '⚡', text: 'Instant access after enrollment' },
          { icon: '🔄', text: 'Cancel or switch plans anytime' },
          { icon: '🎯', text: '94% report improvement within 6 sessions' },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-1.5">
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Institute CTA — kept from the original layout */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm mb-3">
          Need placement readiness at scale for your institution?
        </p>
        <Link
          to="/contact"
          className="inline-block px-6 py-2.5 rounded-full font-bold text-sm border-2 transition-all duration-300 hover:scale-[1.03]"
          style={{ borderColor: '#6161d5', color: '#6161d5' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg,#6161d5,#00127f)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#6161d5'; e.currentTarget.style.borderColor = '#6161d5' }}
        >
          Talk to Our Team
        </Link>
      </div>
    </div>
  )
}
