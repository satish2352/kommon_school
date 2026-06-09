import { useState, useEffect, useMemo } from 'react'
import { useEnrollModal } from '../../context/EnrollModalContext'
import { createEnrollment } from '../../services/enrollmentApi'
import { listPublic as listPublicPlans, selectForEnrollment } from '../../services/plansService'
import {
  // Intentionally NOT importing loadPlanSelection — the modal must only
  // trust the in-memory context signal (consumePreselectedPlan) so that
  // "Enroll Now" from Navbar/Home never restores a stale plan choice
  // from a previous Pricing-page click. See EnrollModalContext.openWithPlan
  // for the persistence side note.
  clearPlanSelection,
  saveEnrollmentId,
  clearEnrollPersistence,
  revalidatePlanSelection,
} from '../../services/enrollPersistence'
import {
  sanitizeName,
  sanitizePhone,
  sanitizeEmail,
  validateEnrollmentBasics,
} from '../../services/validation'
import PlanSelector from './PlanSelector'
import PlanComparisonModal from './PlanComparisonModal'
import PlanConfirmStep from './PlanConfirmStep'
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

// 4-step flow: contact info, preferences, plan (confirm OR choose), payment.
// Step 2 swings between two titles depending on whether a plan was already
// picked on the Pricing Page (`preselectedPlan` is non-null) — handled in
// the render below by reading `step2Title` instead of STEPS[2].title.
const STEPS = [
  { title: 'About You', subtitle: 'Help us understand who you are' },
  { title: 'Practice Preferences', subtitle: 'Almost there!' },
  // Title intentionally short here ("Choose Your Plan") — the in-body
  // PlanSelector renders the full "Choose Your Duration & Plan" header
  // with the 3-step indicator. Keeping the modal-header title short
  // avoids visual duplication while the small subtitle reinforces the
  // duration-then-plan flow.
  { title: 'Choose Your Plan', subtitle: 'Pick a duration first, then a plan' },
  { title: 'Complete payment', subtitle: 'Secure checkout via Razorpay' },
]
// Used when step 2 is rendering the read-only confirmation rather than the
// PlanSelector grid. Keeps the title accurate for screen readers + URL bar.
const STEP_2_CONFIRM = {
  title:    'Confirm Your Plan',
  subtitle: 'Review your selection before payment',
}

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
  const { isOpen, close, consumePreselectedPlan } = useEnrollModal()
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
  // ------------------------------------------------------------------
  // Preselected-plan handoff state
  //
  //   preselectedPlan    — the plan summary picked on the Pricing page,
  //                        either from EnrollModalContext (this-session
  //                        click) or from localStorage (prior session).
  //                        Drives "Confirm" vs "Choose" mode on step 2.
  //   planValidation     — one of:
  //                          'pending'  — re-checking against fresh data
  //                          'valid'    — id matches; price unchanged
  //                          'changed'  — id matches but price/discount
  //                                       moved; show live values + notice
  //                          'inactive' — plan or pricing deactivated;
  //                                       force "Change plan"
  //                          'missing'  — id no longer found
  //                          'fresh'    — no preselection at all (Navbar
  //                                       "Enroll Now" path; user picks
  //                                       inside the modal)
  //   forceChooser       — set by the "Change plan" CTA in the Confirm
  //                        view; forces the PlanSelector grid even if a
  //                        preselection is present.
  // ------------------------------------------------------------------
  const [preselectedPlan, setPreselectedPlan] = useState(null)
  const [planValidation, setPlanValidation]   = useState('fresh')
  const [forceChooser, setForceChooser]       = useState(false)
  // ------------------------------------------------------------------
  // touched: which fields the user has interacted with (blurred or
  // attempted to submit). We hide inline error text until a field is
  // touched so the modal doesn't scream red the second it opens; once
  // a field is touched it shows its current liveErrors entry until
  // valid.
  // ------------------------------------------------------------------
  const [touched, setTouched] = useState({})

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
      setShowComparison(false)
      setForceChooser(false)
      setTouched({})
      setData({
        role: '', education: '', readiness: '', name: '', email: '', phone: '',
        source: '',
      })

      // Read the preselected plan from context ONLY.
      //
      // We deliberately do NOT fall back to localStorage here. Two cases:
      //   - openWithPlan(summary) (Pricing Page → Get Started) → context
      //     holds the chosen plan → confirm mode.
      //   - open() (Navbar / Home "Enroll Now") → context is null →
      //     chooser mode, regardless of any stale planSelection that
      //     might still live in localStorage from a prior session.
      //
      // This is the correct separation of intents: "Enroll Now" means
      // the user wants to enroll fresh, not resume a half-forgotten
      // earlier plan choice.
      const preselection = consumePreselectedPlan()
      setPreselectedPlan(preselection)

      // Seed the "selected plan" working state from the preselection.
      // If revalidation later flags it as inactive/missing, this gets
      // cleared so the user is forced to re-pick.
      setSelectedPlanPricingId(preselection?.planPricingId ?? null)
      setSelectedPlanSummary(preselection ?? null)

      // Mark validation as 'pending' while plans load when we DO have a
      // preselection; 'fresh' (chooser mode) when we don't.
      setPlanValidation(preselection ? 'pending' : 'fresh')

      // Pre-fetch plans so step 2 loads instantly + revalidation can run.
      setPlans([])
      setPlansLoading(true)
      listPublicPlans()
        .then((p) => {
          const safe = Array.isArray(p) ? p : []
          setPlans(safe)
          if (preselection) {
            const result = revalidatePlanSelection(preselection, safe)
            setPlanValidation(result.status)
            // For 'changed', refresh the summary to reflect the live
            // values so the Confirm card shows what the user will be
            // charged (not the cached stale numbers).
            if (result.status === 'changed' && result.pricing && result.plan) {
              const live = {
                planPricingId:   result.pricing.id,
                planId:          result.plan.id,
                planName:        result.plan.name,
                tier:            result.plan.tier,
                durationMonths:  result.pricing.durationMonths,
                durationUnit:    result.pricing.durationUnit ?? 'MONTHS',
                basePrice:       Number(result.pricing.basePrice),
                discountPercent: Number(result.pricing.discountPercent),
                finalPrice:      Number(result.pricing.finalPrice),
                discountLabel:   result.pricing.discountLabel ?? null,
              }
              setPreselectedPlan(live)
              setSelectedPlanPricingId(live.planPricingId)
              setSelectedPlanSummary(live)
            }
            // For 'inactive' / 'missing', clear the working selection so
            // the chooser opens fresh.
            if (result.status === 'inactive' || result.status === 'missing') {
              setSelectedPlanPricingId(null)
              setSelectedPlanSummary(null)
            }
          }
        })
        .catch(() => {
          setPlans([])
          // If plans fail to load, treat any preselection as 'pending' —
          // the user can still proceed via the chooser, which will show
          // its own error state.
        })
        .finally(() => setPlansLoading(false))
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen, consumePreselectedPlan])

  // ------------------------------------------------------------------
  // ESC key suppression
  //
  // Browsers don't auto-close arbitrary <div> modals on ESC, but some
  // screen readers / keyboard helpers map ESC to "dismiss popup". In a
  // payment-critical flow that accidental close would lose the
  // in-progress order and force the student to restart, so we hard-block
  // ESC for as long as the modal is mounted. The capture-phase listener
  // means we run before any framework-level handler (none today, but
  // future-proof).
  //
  // Backdrop click is also suppressed — see the overlay <div> below
  // (it has no onClick handler). Together these mean the ONLY way to
  // close the modal is the X button.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return undefined
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [isOpen])

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }))

  // ------------------------------------------------------------------
  // Live validation
  //
  // Computed every render from the current data. Display layer hides
  // entries the user hasn't `touched` (blurred-or-submitted) yet so the
  // modal doesn't shout red on initial open. `liveErrors` is the source
  // of truth for the Continue button's disabled state; `errors` state
  // is still used for backend / API-level error messages (rare).
  // ------------------------------------------------------------------
  const liveErrors = useMemo(() => {
    if (step === 0) {
      return validateEnrollmentBasics(data)
    }
    if (step === 2) {
      // Step 2 has its own gates: plan must be selected, plan must not
      // be inactive. We surface both as `_plan` so the existing inline
      // error slot keeps working.
      const e = {}
      if (planValidation === 'inactive') {
        e._plan = 'This plan is no longer available — pick another'
      } else if (!selectedPlanPricingId) {
        e._plan = 'Please select a plan to continue'
      }
      return e
    }
    return {}
  }, [step, data, selectedPlanPricingId, planValidation])

  // True iff Continue is allowed to submit on the current step.
  const canContinue = Object.keys(liveErrors).length === 0

  /** Mark a field touched on blur so its error becomes visible. */
  const markTouched = (field) =>
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }))

  /** Returns the error message that should currently show for a field. */
  const errorFor = (field) => (touched[field] ? liveErrors[field] : '') || ''

  const validate = () => {
    // Submit-time gate: reuse the same liveErrors computation, but mark
    // every field in the result as touched so the inline messages
    // become visible to the user.
    if (Object.keys(liveErrors).length === 0) return {}
    setTouched((prev) => {
      const next = { ...prev }
      for (const k of Object.keys(liveErrors)) next[k] = true
      return next
    })
    return liveErrors
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

    // Step 1 → Step 2: submit enrollment, then show plan selector.
    //
    // The backend is now an upsert: if an incomplete enrollment already
    // exists for this email it returns the resumed record (resumed=true)
    // and we move forward exactly as for a fresh submission. The only
    // hard error path is STUDENT_ALREADY_REGISTERED, which means the
    // email is attached to a successfully-paid enrollment — that case
    // gets a distinct, friendlier message routed via `_apiCode` so the
    // user understands the situation instead of seeing a generic "email
    // already used" warning.
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
          resumed: Boolean(enrolled.resumed),
        })
        // Persist the enrollment UUID so a refresh anywhere from here
        // onward keeps working against the same row. (Even without this,
        // the backend's email-based resume would converge — this is a
        // belt-and-suspenders optimisation.)
        if (typeof enrolled.id === 'string') saveEnrollmentId(enrolled.id)
        // Advance to step 2 — plan confirm or chooser
        setStep(2)
      } catch (err) {
        if (err.code === 'ENROLLMENT_ALREADY_EXISTS') {
          // Returning external student who already has a settled enrollment —
          // they have a student panel, so route them to log in and buy there.
          setErrors({
            _api: err.message ||
                  'This enrollment already exists. Please log in to your student panel to purchase a plan.',
            _login: true,
          })
        } else if (err.code === 'STUDENT_ALREADY_REGISTERED') {
          setErrors({
            _api: 'A student is already registered with this email. ' +
                  'If this is you, please contact support — we\'ll help you access your account.',
          })
        } else {
          const detail = Array.isArray(err.details) && err.details.length
            ? err.details.map(d => `${d.field}: ${d.message}`).join('; ')
            : null
          setErrors({ _api: detail || err.message || 'Could not submit. Please try again.' })
        }
      } finally {
        setSubmitting(false)
      }
      return
    }

    // Step 2 → Step 3: select plan then proceed to payment.
    //
    // Two guards in addition to the existing ones:
    //   - If we're in confirm mode with planValidation='inactive', refuse
    //     to proceed (the user must click "Change plan").
    //   - The backend's selectForEnrollment is the authoritative price
    //     re-resolution point — if it rejects with PLAN_INACTIVE /
    //     PLAN_PRICING_INACTIVE, we surface the error and bounce the user
    //     back to the chooser by setting forceChooser=true.
    if (step === 2) {
      if (planValidation === 'inactive') {
        setErrors({ _plan: 'This plan is no longer available. Please pick another.' })
        return
      }
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
        if (err.code === 'PLAN_INACTIVE' || err.code === 'PLAN_PRICING_INACTIVE') {
          // Backend says the plan moved between page-load and continue.
          // Bounce to the chooser so the user can pick something else.
          setPlanValidation('inactive')
          setForceChooser(true)
          setSelectedPlanPricingId(null)
          setSelectedPlanSummary(null)
          setErrors({ _plan: err.message || 'Selected plan is no longer available.' })
          clearPlanSelection()
        } else {
          setErrors({ _api: err.message || 'Could not select plan. Please try again.' })
        }
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

  // Step 2 swings between two titles depending on whether the chooser
  // or the confirmer is rendered. Mirrors the same condition used in the
  // body so the header text is always consistent with what's shown.
  const inConfirmMode =
    step === 2
    && Boolean(preselectedPlan)
    && !forceChooser
    && (planValidation === 'valid' || planValidation === 'changed' || planValidation === 'inactive')

  const currentStepMeta = (step === 2 && inConfirmMode) ? STEP_2_CONFIRM : STEPS[step]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enroll-modal-title"
    >
      {/* Overlay — visual only. No onClick handler: backdrop click MUST
          NOT close the modal because students sometimes brush the
          overlay accidentally during the payment phase. The only close
          affordance is the explicit X button in the header. */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* ── Sticky header: step indicator + progress bar ────────────────── */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-slate-100 z-10 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-0.5">
                Step {step + 1} of {STEPS.length}
              </p>
              {/* On step 2 in CHOOSER mode we promote the in-body
                  "Choose Your Duration & Plan" heading + 3-step indicator
                  up here into the sticky modal header, so the section
                  title and the flow guidance sit together in one block.
                  Every other step (and the Confirm variant of step 2)
                  keeps the standard short title/subtitle pair. */}
              {step === 2 && !inConfirmMode ? (
                <>
                  <h2 id="enroll-modal-title" className="text-lg font-bold text-slate-900">
                    Choose Your Duration &amp; Plan
                  </h2>
                  <div className="text-slate-500 text-[11px] sm:text-xs mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">1</span>
                      Select Duration
                    </span>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">2</span>
                      Choose Plan
                    </span>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">3</span>
                      Continue Enrollment
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h2 id="enroll-modal-title" className="text-lg font-bold text-slate-900">{currentStepMeta.title}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">{currentStepMeta.subtitle}</p>
                </>
              )}
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
                    {/* Name — sanitizeName strips digits/symbols and
                        collapses consecutive spaces on every keystroke.
                        autoComplete + inputMode hint mobile keyboards. */}
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-1.5">Your full name <span className="text-red-400">*</span></p>
                      <input
                        type="text"
                        value={data.name}
                        autoComplete="name"
                        inputMode="text"
                        autoCapitalize="words"
                        spellCheck={false}
                        onChange={e => set('name', sanitizeName(e.target.value))}
                        onBlur={() => {
                          // Trim trailing whitespace on blur so the stored
                          // value is canonical when the user moves on, but
                          // keep typing-time spaces alone for ergonomics.
                          if (data.name !== data.name.trim()) set('name', data.name.trim())
                          markTouched('name')
                        }}
                        placeholder="e.g. Priya Sharma"
                        aria-invalid={Boolean(errorFor('name'))}
                        aria-describedby={errorFor('name') ? 'enroll-name-error' : undefined}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${errorFor('name') ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'}`}
                      />
                      {errorFor('name') && (
                        <p id="enroll-name-error" role="alert" className="text-red-500 text-xs mt-1">
                          {errorFor('name')}
                        </p>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Phone — sanitizePhone strips non-digits, handles
                          "+91 …" paste, truncates to 10. Validation also
                          enforces the 6-9 leading digit. */}
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-1.5">Mobile number <span className="text-red-400">*</span></p>
                        <input
                          type="tel"
                          value={data.phone}
                          autoComplete="tel"
                          inputMode="numeric"
                          pattern="[6-9][0-9]{9}"
                          maxLength={10}
                          onChange={e => set('phone', sanitizePhone(e.target.value))}
                          onBlur={() => markTouched('phone')}
                          placeholder="98765 43210"
                          aria-invalid={Boolean(errorFor('phone'))}
                          aria-describedby={errorFor('phone') ? 'enroll-phone-error' : undefined}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${errorFor('phone') ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'}`}
                        />
                        {errorFor('phone') && (
                          <p id="enroll-phone-error" role="alert" className="text-red-500 text-xs mt-1">
                            {errorFor('phone')}
                          </p>
                        )}
                      </div>
                      {/* Email — sanitizeEmail strips whitespace; the strict
                          regex (TLD ≥ 2 chars) is enforced at validate. */}
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-1.5">Email <span className="text-red-400">*</span></p>
                        <input
                          type="email"
                          value={data.email}
                          autoComplete="email"
                          inputMode="email"
                          spellCheck={false}
                          maxLength={255}
                          onChange={e => set('email', sanitizeEmail(e.target.value))}
                          onBlur={() => markTouched('email')}
                          placeholder="you@email.com"
                          aria-invalid={Boolean(errorFor('email'))}
                          aria-describedby={errorFor('email') ? 'enroll-email-error' : undefined}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${errorFor('email') ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'}`}
                        />
                        {errorFor('email') && (
                          <p id="enroll-email-error" role="alert" className="text-red-500 text-xs mt-1">
                            {errorFor('email')}
                          </p>
                        )}
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
                          <Pill
                            key={r.label}
                            icon={r.icon}
                            label={r.label}
                            selected={data.role === r.label}
                            onClick={() => { set('role', r.label); markTouched('role') }}
                          />
                        ))}
                      </div>
                      {errorFor('role') && (
                        <p role="alert" className="text-red-500 text-xs mt-1.5">{errorFor('role')}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2.5">Education level <span className="text-red-400">*</span></p>
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
                          <Pill
                            key={e.label}
                            icon={e.icon}
                            label={e.label}
                            selected={data.education === e.label}
                            onClick={() => { set('education', e.label); markTouched('education') }}
                          />
                        ))}
                      </div>
                      {errorFor('education') && (
                        <p role="alert" className="text-red-500 text-xs mt-1.5">{errorFor('education')}</p>
                      )}
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

                {/* ── STEP 2: Plan — Confirm (preselected) OR Choose (fallback) ── */}
                {step === 2 && (
                  <div>
                    {plansLoading || planValidation === 'pending' ? (
                      <div className="py-10 text-center text-slate-500 text-sm">
                        Loading plans…
                      </div>
                    ) : plans.length === 0 ? (
                      <div className="py-10 text-center text-slate-500 text-sm">
                        No plans available. Please try again.
                      </div>
                    ) : (
                      // Confirm mode wins when:
                      //   - a preselection is present AND
                      //   - the user hasn't explicitly clicked "Change plan" AND
                      //   - the preselection still maps to a known plan
                      //     (validation is 'valid', 'changed', or 'inactive' —
                      //     the 'inactive' branch shows a banner inside
                      //     PlanConfirmStep with the change-plan CTA enabled).
                      preselectedPlan
                      && !forceChooser
                      && (planValidation === 'valid' || planValidation === 'changed' || planValidation === 'inactive')
                      ? (
                        <PlanConfirmStep
                          summary={selectedPlanSummary || preselectedPlan}
                          status={planValidation}
                          onChange={() => {
                            // User wants to switch — clear preselection,
                            // drop the persisted choice, and let the
                            // PlanSelector render fresh below.
                            setForceChooser(true)
                            setPreselectedPlan(null)
                            setSelectedPlanPricingId(null)
                            setSelectedPlanSummary(null)
                            setPlanValidation('fresh')
                            clearPlanSelection()
                          }}
                        />
                      ) : (
                        <PlanSelector
                          plans={plans}
                          value={selectedPlanPricingId}
                          onChange={(id, summary) => {
                            setSelectedPlanPricingId(id)
                            setSelectedPlanSummary(summary)
                            setErrors(prev => ({ ...prev, _plan: '' }))
                          }}
                          // Prefer the preselected duration when the user came in
                          // via Pricing Page → Get Started; fall back to 1 month
                          // (entry-level slab) when they came in via Navbar
                          // "Enroll Now" with no prior context.
                          defaultDuration={preselectedPlan?.durationMonths ?? 1}
                          onCompare={() => setShowComparison(true)}
                        />
                      )
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
                    onSuccess={() => {
                      // Payment settled — clear all persisted enroll state
                      // so a returning user starts fresh next time. The
                      // backend would still reject re-enrollment with
                      // STUDENT_ALREADY_REGISTERED, but clearing locally
                      // avoids a confusing "you have a plan selected"
                      // banner on the next open.
                      clearEnrollPersistence()
                      setPaid(true)
                    }}
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
                {errors._login && (
                  <a
                    href="/login"
                    className="inline-block mt-1.5 font-semibold underline text-red-800 hover:text-red-900"
                  >
                    Log in to your student panel →
                  </a>
                )}
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
                /* Disabled when:
                     - request in flight (submitting), OR
                     - the current step's live validators say the inputs
                       aren't ready yet (canContinue=false). Step 1
                       (Preferences) has no required fields so liveErrors
                       is always {} there and the button stays enabled. */
                disabled={submitting || !canContinue}
                aria-disabled={submitting || !canContinue}
                className="btn-gradient-cta flex items-center gap-2 px-7 py-2.5 rounded-full text-white font-bold text-sm shadow hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting
                  ? step === 1 ? 'Submitting…' : 'Confirming…'
                  : step === 0
                  ? 'Continue'
                  : step === 1
                  ? 'Submit & Continue'
                  : step === 2
                  ? (inConfirmMode ? 'Confirm & Pay' : 'Continue to Payment')
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
