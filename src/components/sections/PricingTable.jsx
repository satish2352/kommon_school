import { Link } from 'react-router-dom'
import { useEnrollModal } from '../../context/EnrollModalContext'

const plans = [
  {
    name: 'Trial',
    price: '₹29',
    period: 'Introductory Access',
    description: 'Perfect for exploring the platform before unlocking more advanced features.',
    features: [
      'Access to 2 Mock Interview Sessions',
      '1 Guided Learning Roadmap',
      'Email & WhatsApp Support',
    ],
    missing: [
      'Full performance report',
      'Improvement roadmap',
      'Session history',
    ],
    cta: 'Begin Your Journey Today',
    ctaVariant: 'outline',
    highlight: false,
  },
  {
    name: 'Basic',
    price: '₹399',
    period: 'per month',
    description: 'Consistent practice for individuals who are actively job-hunting.',
    features: [
      '15 AI mock interview sessions/mo',
      'Full performance report',
      '15 AI parameters scored',
      'Self-coaching report',
      'Session history (30 days)',
      'Email support',
    ],
    missing: [
      'Improvement roadmap',
      'Advanced analytics',
    ],
    cta: 'Enroll Now',
    ctaVariant: 'primary',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹999',
    period: 'per month',
    description: 'For serious candidates who want to leave nothing to chance.',
    subLabel: 'Chosen by 78% of successful placements',
    features: [
      'Unlimited AI mock interviews',
      'Full performance report',
      '27+ AI parameters scored',
      'Self-coaching reports',
      'Guided improvement roadmap',
      'Unlimited session history',
      'Priority support',
      'Progress trend analysis',
    ],
    missing: [],
    cta: 'Start Pro Today',
    ctaVariant: 'primary',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Institute',
    price: 'Custom',
    period: 'Talk to Our Team',
    description: 'Placement readiness at scale for colleges and training institutes.',
    features: [
      'Unlimited student accounts',
      'Batch analytics dashboard',
      'Student performance tracking',
      'All 27+ AI parameters',
      'Self-coaching reports per student',
      'Placement readiness scoring',
      'Dedicated account manager',
      'API & LMS integration',
      'Custom branding',
    ],
    missing: [],
    cta: 'Talk to Our Team',
    ctaVariant: 'outline',
    highlight: false,
    isInstitute: true,
  },
]

export default function PricingTable() {
  const { open: openEnroll } = useEnrollModal()
  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end overflow-visible px-2 py-4 -mx-2 -my-4">
        {plans.map((plan, i) => (
          <div
            key={plan.name}
            data-aos="fade-up"
            data-aos-delay={String(i * 100)}
            className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 ${
              plan.highlight
                ? 'text-white shadow-2xl scale-105 hover:scale-[1.07] hover:shadow-[#6161d5]/30'
                : 'bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-[#6161d5]/20'
            }`}
            style={plan.highlight ? {
              background: 'linear-gradient(135deg, #6161d5, #1E2448 30%, #2A3A6A 58%, #00127f 82%, #08081c)',
              minHeight: '100%',
            } : {}}
          >
            {/* Most Popular badge */}
            {plan.badge && (
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-white text-xs font-bold shadow-lg whitespace-nowrap flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #6161d5, #00127f)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {plan.badge}
              </div>
            )}

            {/* Plan header */}
            <div className="mb-5">
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${plan.highlight ? 'text-white/50' : 'text-gray-400'}`}>
                {plan.name}
              </div>
              <div className="flex items-end gap-1.5 mb-1">
                <span className={`text-4xl font-extrabold leading-none ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                </span>
                {plan.period !== 'Talk to Our Team' && (
                  <span className={`text-sm pb-0.5 ${plan.highlight ? 'text-white/50' : 'text-gray-400'}`}>
                    {plan.period}
                  </span>
                )}
              </div>
              {plan.period === 'Talk to Our Team' && (
                <div
                  className="text-sm font-bold mt-1"
                  style={{
                    background: 'linear-gradient(135deg, #6161d5, #00127f)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {plan.period}
                </div>
              )}
              <p className={`text-xs mt-2 leading-relaxed ${plan.highlight ? 'text-white/60' : 'text-gray-500'}`}>
                {plan.description}
              </p>
              {plan.subLabel && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-white/70 font-medium">{plan.subLabel}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className={`h-px mb-5 ${plan.highlight ? 'bg-white/10' : 'bg-gray-100'}`} />

            {/* Features */}
            <div className="flex-1 space-y-2.5 mb-6">
              {plan.features.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <svg
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-green-400' : 'text-green-500'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={`text-xs leading-relaxed ${plan.highlight ? 'text-white/85' : 'text-gray-600'}`}>{f}</span>
                </div>
              ))}
              {plan.missing.map((f) => (
                <div key={f} className="flex items-start gap-2.5 opacity-30">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-xs line-through text-gray-400">{f}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div>
              {plan.isInstitute ? (
                <Link
                  to="/contact"
                  className="block text-center px-5 py-3 rounded-full font-bold text-sm border-2 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5"
                  style={{ borderColor: '#6161d5', color: '#6161d5' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#6161d5,#00127f)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent' }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#6161d5'; e.currentTarget.style.borderColor = '#6161d5' }}
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  onClick={openEnroll}
                  className={`w-full block text-center px-5 py-3 rounded-full font-bold text-sm transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 ${
                    plan.highlight
                      ? 'bg-white text-[#1E2448] hover:bg-white/90 shadow-lg'
                      : plan.ctaVariant === 'primary'
                      ? 'btn-gradient-cta text-white shadow-md'
                      : 'border-2 border-gray-200 text-gray-500 hover:border-[#6161d5] hover:text-[#6161d5]'
                  }`}
                >
                  {plan.cta}
                </button>
              )}
              {plan.highlight && (
                <p className="text-center text-white/40 text-[10px] mt-2">No lock-in · Cancel anytime</p>
              )}
            </div>
          </div>
        ))}
      </div>

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
    </div>
  )
}
