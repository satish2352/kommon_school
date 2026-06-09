/**
 * UpgradePlan — standalone public page behind the shareable link
 *   <host>/upgrade/<student_email>
 *
 * It drops the student straight into "Step 3" of the enrollment flow — plan
 * selection — then continues to payment, reusing the exact same building blocks
 * as the Enroll-Now modal (PlanSelector + PaymentFlow). No contact form: the
 * backend resolves/creates the student's draft enrollment from the email alone
 * (POST /enrollments/upgrade) and auto-fills their identity.
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { startUpgrade } from '../services/enrollmentApi'
import { listPublic as listPublicPlans, selectForEnrollment } from '../services/plansService'
import PlanSelector from '../components/common/PlanSelector'
import PlanComparisonModal from '../components/common/PlanComparisonModal'
import PaymentFlow from '../components/common/PaymentFlow'

// Mini step indicator — the in-flow "Step 3 → Step 4" the link drops into.
function StepDots({ active }) {
  const steps = ['Choose Plan', 'Payment']
  return (
    <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5">
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
              i === active ? 'bg-indigo-600 text-white' : i < active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>{i < active ? '✓' : i + 1}</span>
            <span className={i === active ? 'font-semibold text-slate-800' : 'text-slate-400'}>{label}</span>
          </span>
          {i < steps.length - 1 && <span className="text-slate-300">•</span>}
        </div>
      ))}
    </div>
  )
}

export default function UpgradePlan() {
  const { email: emailParam } = useParams()
  const email = decodeURIComponent(emailParam ?? '')

  // 'init' → loading enrollment + plans; 'plan' → selection; 'payment'; 'done'
  const [phase, setPhase] = useState('init')
  const [error, setError] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [plans, setPlans] = useState([])
  const [selectedPlanPricingId, setSelectedPlanPricingId] = useState(null)
  const [selectedPlanSummary, setSelectedPlanSummary] = useState(null)
  const [showComparison, setShowComparison] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Bootstrap: resolve the draft enrollment for this email + load plans.
  useEffect(() => {
    let cancelled = false
    setPhase('init')
    setError(null)
    Promise.all([startUpgrade(email), listPublicPlans()])
      .then(([resp, planList]) => {
        if (cancelled) return
        const e = resp?.data ?? resp
        setEnrollment({ id: e.id, enrollmentId: e.enrollmentId, name: e.name, email: e.email, phone: e.phone })
        setPlans(Array.isArray(planList) ? planList : [])
        setPhase('plan')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.message ?? 'Could not start your upgrade. Please check the link and try again.')
        setPhase('error')
      })
    return () => { cancelled = true }
  }, [email])

  const proceedToPayment = async () => {
    if (!selectedPlanPricingId || !enrollment?.id) return
    setSubmitting(true)
    setError(null)
    try {
      await selectForEnrollment(enrollment.id, selectedPlanPricingId)
      setPhase('payment')
    } catch (err) {
      setError(err?.message ?? 'Could not select that plan. Please pick another and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const headerTitle =
    phase === 'payment' ? 'Complete payment'
    : phase === 'done' ? 'You\'re all set!'
    : 'Choose your plan'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50 flex items-start sm:items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-extrabold tracking-tight text-indigo-600">Kommon School</span>
            <span className="ml-auto text-[11px] font-semibold uppercase tracking-widest text-indigo-500">Plan Upgrade</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{headerTitle}</h1>
          {email && (
            <p className="text-slate-400 text-xs mt-0.5">
              for <span className="font-medium text-slate-600">{email}</span>
            </p>
          )}
          {(phase === 'plan' || phase === 'payment') && (
            <div className="mt-4"><StepDots active={phase === 'payment' ? 1 : 0} /></div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-6">

          {phase === 'init' && (
            <div className="py-16 text-center text-slate-500 text-sm">
              <div className="w-8 h-8 mx-auto mb-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              Setting up your upgrade…
            </div>
          )}

          {phase === 'error' && (
            <div className="py-10 text-center">
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm inline-block">
                {error}
              </div>
            </div>
          )}

          {phase === 'plan' && (
            <div>
              {plans.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">No plans available right now. Please try again later.</div>
              ) : (
                <PlanSelector
                  plans={plans}
                  value={selectedPlanPricingId}
                  onChange={(id, summary) => {
                    setSelectedPlanPricingId(id)
                    setSelectedPlanSummary(summary)
                    setError(null)
                  }}
                  defaultDuration={1}
                  onCompare={() => setShowComparison(true)}
                />
              )}
              {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
              <PlanComparisonModal plans={plans} isOpen={showComparison} onClose={() => setShowComparison(false)} />

              <div className="mt-6 flex justify-end">
                <button
                  onClick={proceedToPayment}
                  disabled={submitting || !selectedPlanPricingId}
                  className="btn-gradient-cta px-7 py-2.5 rounded-full text-white font-bold text-sm shadow hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Confirming…' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          )}

          {phase === 'payment' && enrollment && (
            <PaymentFlow
              enrollment={enrollment}
              selectedPlan={selectedPlanSummary}
              onSuccess={() => setPhase('done')}
              onClose={() => setPhase('done')}
            />
          )}

          {phase === 'done' && (
            <div className="py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Thank you!</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                Your upgrade for <span className="font-medium text-slate-700">{email}</span> is being processed.
                A confirmation will reach you by email.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
