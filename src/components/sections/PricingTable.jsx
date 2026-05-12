import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useEnrollModal } from '../../context/EnrollModalContext'
import { listPublic } from '../../services/plansService'

// ── Tier display config ──────────────────────────────────────────────────────
const TIER_CARD = {
  SILVER:   { highlight: false, gradient: false },
  GOLD:     { highlight: false, gradient: false },
  PLATINUM: { highlight: true,  gradient: true  },
}

// ── Skeleton placeholder for loading state ───────────────────────────────────
function SkeletonCard() {
  return (
    <div className="relative rounded-2xl p-6 flex flex-col bg-white border border-gray-100 shadow-sm animate-pulse">
      <div className="h-3 bg-slate-200 rounded w-1/3 mb-5" />
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-2/3 mb-5" />
      <div className="h-px bg-gray-100 mb-5" />
      <div className="space-y-2.5 flex-1 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-2.5">
            <div className="w-4 h-4 rounded-full bg-slate-200 shrink-0 mt-0.5" />
            <div className="h-3 bg-slate-100 rounded flex-1" />
          </div>
        ))}
      </div>
      <div className="h-10 bg-slate-200 rounded-full" />
    </div>
  )
}

// ── Individual plan card ──────────────────────────────────────────────────────
function PlanCard({ plan, openEnroll }) {
  const config = TIER_CARD[plan.tier] ?? TIER_CARD.SILVER

  // Pick the cheapest active pricing to display (lowest finalPrice)
  const activePricings = (plan.pricings ?? []).filter((p) => p.status === 'ACTIVE')
  const displayPricing = activePricings.length > 0
    ? activePricings.reduce((a, b) => Number(a.finalPrice) < Number(b.finalPrice) ? a : b)
    : null

  const priceDisplay = displayPricing
    ? `₹${Number(displayPricing.finalPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : 'Contact us'

  const periodDisplay = displayPricing
    ? `/ ${displayPricing.durationMonths === 1 ? 'month' : `${displayPricing.durationMonths} months`}`
    : ''

  return (
    <div
      data-aos="fade-up"
      className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 ${
        config.highlight
          ? 'text-white shadow-2xl scale-105 hover:scale-[1.07]'
          : 'bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-[#6161d5]/20'
      }`}
      style={config.gradient ? {
        background: 'linear-gradient(135deg, #6161d5, #1E2448 30%, #2A3A6A 58%, #00127f 82%, #08081c)',
        minHeight: '100%',
      } : {}}
    >
      {/* HighlightLabel ribbon (e.g. "Most Popular") */}
      {plan.highlightLabel && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-white text-xs font-bold shadow-lg whitespace-nowrap flex items-center gap-1.5"
          style={{ background: 'linear-gradient(135deg, #6161d5, #00127f)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {plan.highlightLabel}
        </div>
      )}

      {/* Plan header */}
      <div className="mb-5">
        <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${config.highlight ? 'text-white/50' : 'text-gray-400'}`}>
          {plan.name}
        </div>
        <div className="flex items-end gap-1.5 mb-1">
          <span className={`text-4xl font-extrabold leading-none ${config.highlight ? 'text-white' : 'text-gray-900'}`}>
            {priceDisplay}
          </span>
          {periodDisplay && (
            <span className={`text-sm pb-0.5 ${config.highlight ? 'text-white/50' : 'text-gray-400'}`}>
              {periodDisplay}
            </span>
          )}
        </div>
        {plan.tagline && (
          <p className={`text-xs mt-2 leading-relaxed ${config.highlight ? 'text-white/60' : 'text-gray-500'}`}>
            {plan.tagline}
          </p>
        )}
        {plan.promoCode && (
          <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.highlight ? 'bg-white/10 border border-white/15' : 'bg-indigo-50 border border-indigo-100'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className={`text-[10px] font-medium ${config.highlight ? 'text-white/70' : 'text-indigo-600'}`}>
              Promo: {plan.promoCode}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className={`h-px mb-5 ${config.highlight ? 'bg-white/10' : 'bg-gray-100'}`} />

      {/* Features */}
      <div className="flex-1 space-y-2.5 mb-6">
        {(Array.isArray(plan.features) ? plan.features : []).map((f) => (
          <div key={f} className="flex items-start gap-2.5">
            <svg
              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${config.highlight ? 'text-green-400' : 'text-green-500'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className={`text-xs leading-relaxed ${config.highlight ? 'text-white/85' : 'text-gray-600'}`}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div>
        <button
          onClick={openEnroll}
          className={`w-full block text-center px-5 py-3 rounded-full font-bold text-sm transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 ${
            config.highlight
              ? 'bg-white text-[#1E2448] hover:bg-white/90 shadow-lg'
              : 'btn-gradient-cta text-white shadow-md'
          }`}
        >
          Get started
        </button>
        {config.highlight && (
          <p className="text-center text-white/40 text-[10px] mt-2">No lock-in · Cancel anytime</p>
        )}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PricingTable() {
  const { open: openEnroll } = useEnrollModal()
  const [plans, setPlans] = useState([])
  // loading starts true so the skeleton shows on mount without calling setState in an effect
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    listPublic()
      .then((data) => {
        if (!cancelled) {
          setPlans(data)
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

  return (
    <div>
      {/* ── Loading: 3 skeleton cards ── */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-end px-2 py-4 -mx-2 -my-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* ── Error state ── */}
      {!loading && error && (
        <div className="py-8 text-center">
          <p className="text-gray-500 text-sm mb-3">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); setRetryKey((k) => k + 1) }}
            className="px-5 py-2 rounded-full border border-[#6161d5] text-[#6161d5] text-sm font-semibold hover:bg-[#6161d5] hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loaded plans ── */}
      {!loading && !error && plans.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-end overflow-visible px-2 py-4 -mx-2 -my-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} openEnroll={openEnroll} />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && plans.length === 0 && (
        <div className="py-8 text-center text-gray-400 text-sm">
          No plans available right now. Please check back soon.
        </div>
      )}

      {/* Trust strip */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-gray-400 text-xs">
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

      {/* Institute CTA */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm mb-3">
          Need placement readiness at scale for your institution?
        </p>
        <Link
          to="/contact"
          className="inline-block px-6 py-2.5 rounded-full font-bold text-sm border-2 transition-all duration-300 hover:scale-[1.03]"
          style={{ borderColor: '#6161d5', color: '#6161d5' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#6161d5,#00127f)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent' }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#6161d5'; e.currentTarget.style.borderColor = '#6161d5' }}
        >
          Talk to Our Team
        </Link>
      </div>
    </div>
  )
}
