import { useState, useEffect } from 'react'
import { useEnrollModal } from '../../context/EnrollModalContext'
import { createEnrollment } from '../../services/enrollmentApi'
import { listPublic as listPublicPlans, selectForEnrollment } from '../../services/plansService'
import PlanSelector from './PlanSelector'
import PlanComparisonModal from './PlanComparisonModal'
import PaymentFlow from './PaymentFlow'

// Map user-friendly labels in the form to the backend enum values.
const ROLE_MAP = {
  'Student': 'STUDENT',
  'Fresh Graduate': 'FRESH_GRADUATE',
  'Working Professional': 'WORKING_PROFESSIONAL',
  'Career Switcher': 'CAREER_SWITCHER',
}
const EDUCATION_MAP = {
  'School': 'SCHOOL',
  'Jr College': 'JR_COLLEGE',
  'Undergraduate': 'UNDERGRADUATE',
  'Graduate': 'GRADUATE',
  'Post Graduate': 'POST_GRADUATE',
  'Doctorate': 'DOCTORATE',
  'Other': 'OTHER',
}
const READINESS_MAP = {
  'Beginner': 'BEGINNER',
  'Intermediate': 'INTERMEDIATE',
  'Ready for Interview': 'READY_FOR_INTERVIEW',
}
const SOURCE_MAP = {
  'Social Media': 'SOCIAL_MEDIA',
  'College / University': 'COLLEGE',
  'Friend / Colleague': 'FRIEND',
  'Google Search': 'GOOGLE',
  'Other': 'OTHER',
}

// 4-step flow: contact info, preferences, plan selection, payment
const STEPS = [
  { title: 'About You', subtitle: 'Help us understand who you are' },
  { title: 'Practice Preferences', subtitle: 'Almost there!' },
  { title: 'Choose Your Plan', subtitle: 'Pick the plan that works for you' },
  { title: 'Complete payment', subtitle: 'Secure checkout via Razorpay' },
]

const Pill = ({ icon, label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
      selected
        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
    }`}
  >
    {icon && <span className="text-base leading-none">{icon}</span>}
    {label}
  </button>
)

const Card = ({ icon, label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center text-xs font-semibold transition-all duration-150 ${
      selected
        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
    }`}
  >
    <span className="text-lg">{icon}</span>
    {label}
  </button>
)

export default function EnrollModal() {
  const { isOpen, close } = useEnrollModal()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    role: '', education: '', readiness: '', name: '', email: '', phone: '',
    source: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [createdEnrollment, setCreatedEnrollment] = useState(null)
  // Plan selection state
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [selectedPlanPricingId, setSelectedPlanPricingId] = useState(null)
  const [selectedPlanSummary, setSelectedPlanSummary] = useState(null)
  const [showComparison, setShowComparison] = useState(false)
  // Tracks whether the payment step completed successfully
  const [paid, setPaid] = useState(false)

  // Body scroll lock + state reset + plans pre-fetch — all gated on isOpen changes.
  // Note: setState calls inside effects are a project-wide lint pattern; pre-existing in all modal components.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Reset all state on open
      setStep(0)
      setPaid(false)
      setErrors({})
      setSubmitting(false)
      setCreatedEnrollment(null)
      setSelectedPlanPricingId(null)
      setSelectedPlanSummary(null)
      setShowComparison(false)
      setData({
        role: '', education: '', readiness: '', name: '', email: '', phone: '',
        source: '',
      })
      // Pre-fetch plans so step 2 loads instantly
      setPlans([])
      setPlansLoading(true)
      listPublicPlans()
        .then((p) => setPlans(p))
        .catch(() => setPlans([]))
        .finally(() => setPlansLoading(false))
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }))

  const validate = () => {
    const e = {}
    if (step === 0) {
      if (!data.name.trim()) e.name = 'Full name is required'
      else if (data.name.trim().length < 2) e.name = 'Enter a valid name'
      if (!data.phone.trim()) e.phone = 'Mobile number is required'
      else if (!/^\d{10}$/.test(data.phone)) e.phone = 'Enter a valid 10-digit mobile number'
      if (!data.email.trim()) e.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email address'
      if (!data.role) e.role = 'Please select who you are'
    }
    if (step === 2) {
      if (!selectedPlanPricingId) {
        e._plan = 'Please select a plan to continue'
      }
    }
    return e
  }

  const next = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})

    // Step 0 → Step 1: just advance
    if (step === 0) {
      setStep(1)
      return
    }

    // Step 1 → Step 2: submit enrollment, then show plan selector
    if (step === 1) {
      setSubmitting(true)

      try {
        const payload = {
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
          role: ROLE_MAP[data.role],
          ...(data.education ? { education: EDUCATION_MAP[data.education] } : {}),
          ...(data.readiness ? { readiness: READINESS_MAP[data.readiness] } : {}),
          ...(data.source ? { source: SOURCE_MAP[data.source] } : {}),
        }
        const resp = await createEnrollment(payload)
        const enrolled = resp?.data ?? resp
        setCreatedEnrollment({
          id: enrolled.id,
          enrollmentId: enrolled.enrollmentId,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
        })
        // Advance to step 2 — plan selection
        setStep(2)
      } catch (err) {
        const detail = Array.isArray(err.details) && err.details.length
          ? err.details.map(d => `${d.field}: ${d.message}`).join('; ')
          : null
        setErrors({ _api: detail || err.message || 'Could not submit. Please try again.' })
      } finally {
        setSubmitting(false)
      }
      return
    }

    // Step 2 → Step 3: select plan then proceed to payment
    if (step === 2) {
      if (!selectedPlanPricingId) {
        setErrors({ _plan: 'Please select a plan to continue' })
        return
      }
      if (!createdEnrollment?.id) {
        setErrors({ _api: 'Enrollment not found. Please start over.' })
        return
      }
      setSubmitting(true)
      try {
        await selectForEnrollment(createdEnrollment.id, selectedPlanPricingId)
        // Advance to step 3 — payment
        setStep(3)
      } catch (err) {
        setErrors({ _api: err.message || 'Could not select plan. Please try again.' })
      } finally {
        setSubmitting(false)
      }
      return
    }
  }

  const back = () => {
    // Back is only available on steps 0, 1, and 2
    // Step 3 (payment) has no back button — user can close
    setErrors({})
    setStep(s => s - 1)
  }

  if (!isOpen) return null

  // Whether we're on the payment step
  const isPaymentStep = step === 3

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay — always closable (PaymentFlow handles its own in-flight lock via lockRef) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* ── Sticky header: step indicator + progress bar ────────────────── */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-slate-100 z-10 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-0.5">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-lg font-bold text-slate-900">{STEPS[step].title}</h2>
              <p className="text-slate-400 text-xs mt-0.5">{STEPS[step].subtitle}</p>
            </div>
            {/* Close button always visible */}
            <button
              onClick={close}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* 3-segment progress bar */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-indigo-600' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5">

            {/* ── Post-payment success screen ── */}
            {paid ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">You're all set, {data.name.split(' ')[0]}!</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                  We'll reach out to <span className="font-medium text-slate-700">{data.email}</span> shortly with your personalised plan.
                </p>
                <button onClick={close} className="btn-gradient-cta px-8 py-3 rounded-full text-white font-bold text-sm">
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-6">

                {/* ── STEP 0: Contact + Identity ── */}
                {step === 0 && (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-1.5">Your full name <span className="text-red-400">*</span></p>
                      <input
                        type="text" value={data.name} onChange={e => { set('name', e.target.value); setErrors(prev => ({ ...prev, name: '' })) }}
                        placeholder="e.g. Priya Sharma"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'}`}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-1.5">Mobile number <span className="text-red-400">*</span></p>
                        <input
                          type="tel" value={data.phone} onChange={e => { set('phone', e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors(prev => ({ ...prev, phone: '' })) }}
                          placeholder="98765 43210"
                          maxLength={10}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'}`}
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-1.5">Email <span className="text-red-400">*</span></p>
                        <input
                          type="email" value={data.email} onChange={e => { set('email', e.target.value); setErrors(prev => ({ ...prev, email: '' })) }}
                          placeholder="you@email.com"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'}`}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2.5">I am a… <span className="text-red-400">*</span></p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { icon: '📚', label: 'Student' },
                          { icon: '🎓', label: 'Fresh Graduate' },
                          { icon: '💼', label: 'Working Professional' },
                          { icon: '🔄', label: 'Career Switcher' },
                        ].map(r => (
                          <Pill key={r.label} icon={r.icon} label={r.label} selected={data.role === r.label} onClick={() => { set('role', r.label); setErrors(prev => ({ ...prev, role: '' })) }} />
                        ))}
                      </div>
                      {errors.role && <p className="text-red-500 text-xs mt-1.5">{errors.role}</p>}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2.5">Education level</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { icon: '🏫', label: 'School' },
                          { icon: '🏛️', label: 'Jr College' },
                          { icon: '📖', label: 'Undergraduate' },
                          { icon: '🎓', label: 'Graduate' },
                          { icon: '📜', label: 'Post Graduate' },
                          { icon: '🧪', label: 'Doctorate' },
                          { icon: '✨', label: 'Other' },
                        ].map(e => (
                          <Pill key={e.label} icon={e.icon} label={e.label} selected={data.education === e.label} onClick={() => set('education', e.label)} />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ── STEP 1: Preferences ── */}
                {step === 1 && (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2.5">Placement Readiness</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { icon: '🌱', label: 'Beginner' },
                          { icon: '⚙️', label: 'Intermediate' },
                          { icon: '🎯', label: 'Ready for Interview' },
                        ].map(r => (
                          <Card key={r.label} icon={r.icon} label={r.label} selected={data.readiness === r.label} onClick={() => set('readiness', r.label)} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2.5">How did you hear about us?</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { icon: '📱', label: 'Social Media' },
                          { icon: '🏫', label: 'College / University' },
                          { icon: '👥', label: 'Friend / Colleague' },
                          { icon: '🔍', label: 'Google Search' },
                          { icon: '✨', label: 'Other' },
                        ].map(s => (
                          <Pill key={s.label} icon={s.icon} label={s.label} selected={data.source === s.label} onClick={() => set('source', s.label)} />
                        ))}
                      </div>
                    </div>

                  </>
                )}

                {/* ── STEP 2: Plan selection ── */}
                {step === 2 && (
                  <div>
                    {plansLoading ? (
                      <div className="py-10 text-center text-slate-500 text-sm">
                        Loading plans…
                      </div>
                    ) : plans.length === 0 ? (
                      <div className="py-10 text-center text-slate-500 text-sm">
                        No plans available. Please try again.
                      </div>
                    ) : (
                      <PlanSelector
                        plans={plans}
                        value={selectedPlanPricingId}
                        onChange={(id, summary) => {
                          setSelectedPlanPricingId(id)
                          setSelectedPlanSummary(summary)
                          setErrors(prev => ({ ...prev, _plan: '' }))
                        }}
                        defaultDuration={6}
                        onCompare={() => setShowComparison(true)}
                      />
                    )}
                    {errors._plan && (
                      <p className="text-red-500 text-xs mt-2">{errors._plan}</p>
                    )}
                    <PlanComparisonModal
                      plans={plans}
                      isOpen={showComparison}
                      onClose={() => setShowComparison(false)}
                    />
                  </div>
                )}

                {/* ── STEP 3: Payment (inline, same modal) ── */}
                {step === 3 && createdEnrollment && (
                  <PaymentFlow
                    enrollment={createdEnrollment}
                    onSuccess={() => setPaid(true)}
                    onClose={close}
                    selectedPlan={selectedPlanSummary}
                  />
                )}

                {/* Show spinner if we just submitted and are waiting for enrollment creation */}
                {step === 3 && !createdEnrollment && (
                  <div className="py-10 text-center text-slate-500 text-sm">
                    Setting up your enrollment…
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky footer — hidden on step 2 and when paid (PaymentFlow owns its buttons) ── */}
        {!isPaymentStep && !paid && (
          <div className="sticky bottom-0 bg-white rounded-b-3xl px-6 py-4 border-t border-slate-100 shrink-0">
            {errors._api && (
              <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs mb-3">
                {errors._api}
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              {step > 0 ? (
                <button
                  onClick={back}
                  disabled={submitting}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={next}
                disabled={submitting}
                className="btn-gradient-cta flex items-center gap-2 px-7 py-2.5 rounded-full text-white font-bold text-sm shadow hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting
                  ? step === 1 ? 'Submitting…' : 'Confirming…'
                  : step === 0
                  ? 'Continue'
                  : step === 1
                  ? 'Submit & Continue'
                  : step === 2
                  ? 'Continue to Payment'
                  : 'Submit & Enroll'}
                {!submitting && step === 0 && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
