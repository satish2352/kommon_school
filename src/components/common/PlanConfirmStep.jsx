/**
 * PlanConfirmStep
 * ---------------
 * Read-only confirmation of the plan the student picked on the Pricing
 * Page. Replaces the PlanSelector grid inside the EnrollModal when a
 * preselection exists, so the student doesn't have to choose twice.
 *
 * Status-driven render
 * --------------------
 * The parent passes a `status` derived from
 * enrollPersistence.revalidatePlanSelection():
 *   'valid'    — show the summary, single Continue button
 *   'changed'  — show updated live values + a "price updated" notice;
 *                still allow Continue with the live values
 *   'inactive' — plan or pricing got deactivated since selection;
 *                Continue disabled, force "Change plan"
 * The 'missing' case is handled by the parent (falls back to PlanSelector
 * directly), so this component never has to render an empty state.
 *
 * Why a separate component
 * ------------------------
 * Keeps EnrollModal focused on flow / state-machine concerns. The Confirm
 * step is purely presentational and easy to test in isolation.
 *
 * Props
 *   summary  — { planPricingId, planName, tier, durationMonths,
 *               basePrice, discountPercent, finalPrice, discountLabel }
 *               If status is 'changed', this should be the LIVE values
 *               (re-fetched), not the stale localStorage values.
 *   status   — 'valid' | 'changed' | 'inactive'
 *   onChange — () => void   user clicked "Change plan"
 */

import PlanSummaryCard from './PlanSummaryCard'

const inr = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export default function PlanConfirmStep({ summary, status, onChange }) {
  if (!summary) return null

  const isInactive = status === 'inactive'
  const isChanged  = status === 'changed'

  return (
    <div className="space-y-4">
      {/* Status banner — only shown when something is off */}
      {isInactive && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm">
          <div className="font-semibold text-rose-700 mb-0.5">
            This plan is no longer available
          </div>
          <p className="text-rose-600 text-xs leading-relaxed">
            The plan you selected on the Pricing page has been deactivated.
            Please choose a different plan to continue.
          </p>
        </div>
      )}

      {isChanged && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm">
          <div className="font-semibold text-amber-700 mb-0.5">
            Pricing was updated
          </div>
          <p className="text-amber-600 text-xs leading-relaxed">
            The price or discount for this plan changed since you picked it.
            The current price is shown below — verify before continuing.
          </p>
        </div>
      )}

      {/* Plan summary card — re-used from the Payment step for visual
          consistency. Sized up a touch via the surrounding wrapper. */}
      <PlanSummaryCard plan={summary} />

      {/* Detail block — shows the line items behind the final price.
          Helpful when status is 'changed' so the user can see exactly
          what moved. */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Order summary
          </div>
        </div>

        <dl className="px-4 py-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Plan</dt>
            <dd className="font-semibold text-slate-900">
              {summary.tier} · {summary.planName}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Duration</dt>
            <dd className="font-semibold text-slate-900">
              {summary.durationMonths === 1
                ? '1 Month'
                : `${summary.durationMonths} Months`}
            </dd>
          </div>
          {summary.basePrice != null && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Base price</dt>
              <dd className={`text-slate-900 ${Number(summary.discountPercent) > 0 ? 'line-through opacity-60' : ''}`}>
                {inr(summary.basePrice)}
              </dd>
            </div>
          )}
          {Number(summary.discountPercent) > 0 && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Discount</dt>
              {/* Discount value — show admin-set label when present (e.g.
                  "Year-end sale"), else the computed percentage. Avoids
                  duplicates like "−10.00% · 10% off" when an admin types
                  the percentage as the label. */}
              <dd className="font-semibold text-emerald-600">
                {summary.discountLabel
                  ? summary.discountLabel
                  : `−${Number(summary.discountPercent).toFixed(2)}%`}
              </dd>
            </div>
          )}
          <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between">
            <dt className="text-slate-700 font-semibold">Total payable</dt>
            <dd className="text-lg font-extrabold text-slate-900">
              {inr(summary.finalPrice)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Change-plan affordance — always available so the user is never
          stuck with the persisted choice if they changed their mind. */}
      <div className="text-center">
        <button
          type="button"
          onClick={onChange}
          className="text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-2 font-medium transition-colors"
        >
          {isInactive ? 'Choose a different plan' : 'Change plan'}
        </button>
      </div>
    </div>
  )
}
