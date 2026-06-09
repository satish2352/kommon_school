import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PageHeader } from '../../components/admin'
import PlanPicker from '../../components/common/PlanPicker'
import PaymentFlow from '../../components/common/PaymentFlow'
import { panelService } from '../../services/panelService'
import { selectForEnrollment } from '../../services/plansService'

/**
 * PanelPurchase — logged-in student buys a new plan.
 *
 * Reuses the public /pricing "Choose Your Duration & Plan" design (PlanPicker)
 * and the shared Razorpay PaymentFlow. The difference vs the public flow: no
 * data-collection step — the student is authenticated, so we create their
 * enrollment server-side (identity auto-filled from their last enrollment),
 * select the plan, and go straight to payment.
 */
export default function PanelPurchase() {
  const navigate = useNavigate()
  const [busyPricingId, setBusyPricingId] = useState(null)
  const [payEnrollment, setPayEnrollment]   = useState(null) // { id, enrollmentId, name, email, phone }
  const [selectedPlan, setSelectedPlan]     = useState(null)  // summary for PlanSummaryCard

  const handleSelect = async (plan, pricing) => {
    if (!pricing || busyPricingId) return
    setBusyPricingId(pricing.id)
    try {
      // 1. Create (or reuse) a fresh enrollment for the logged-in student.
      const resp = await panelService.startPurchase()
      const enrollment = resp?.data ?? resp
      if (!enrollment?.id) throw new Error('Could not start the purchase. Please try again.')

      // 2. Attach the chosen plan pricing (backend re-resolves price from DB).
      await selectForEnrollment(enrollment.id, pricing.id)

      // 3. Open the payment modal — the shared PaymentFlow drives Razorpay.
      setSelectedPlan({
        tier:            plan.tier,
        name:            plan.name,
        durationMonths:  pricing.durationMonths,
        durationUnit:    pricing.durationUnit ?? 'MONTHS',
        finalPrice:      Number(pricing.finalPrice),
        discountPercent: Number(pricing.discountPercent),
        discountLabel:   pricing.discountLabel ?? null,
      })
      setPayEnrollment(enrollment)
    } catch (err) {
      toast.error(err?.message ?? 'Could not start the purchase. Please try again.')
    } finally {
      setBusyPricingId(null)
    }
  }

  const closePay = () => { setPayEnrollment(null); setSelectedPlan(null) }

  const onPaySuccess = () => {
    toast.success('Payment received! Your new plan is being activated.')
    // Leave the modal on its success screen; the student taps "Done" to close,
    // then we route them to their transaction history.
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buy a Plan"
        subtitle="Pick a duration and plan, then pay securely — your details are filled in for you."
      />

      <PlanPicker onSelect={handleSelect} busyPlanPricingId={busyPricingId} ctaLabel="Buy this plan" />

      {/* Payment modal */}
      {payEnrollment && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closePay} aria-hidden="true" />
          <div className="relative bg-white w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between z-10">
              <h3 className="text-base font-semibold text-slate-900">Complete your purchase</h3>
              <button
                onClick={closePay}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <PaymentFlow
                enrollment={payEnrollment}
                selectedPlan={selectedPlan}
                onSuccess={onPaySuccess}
                onClose={() => { closePay(); navigate('/panel/transactions') }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
