/**
 * PlanComparisonModal — full feature matrix across all 3 plans.
 *
 * Props:
 *   plans       — array of Plan objects from listPublic()
 *   isOpen      — boolean
 *   onClose     — () => void
 */

const TIER_HEADER_STYLES = {
  SILVER:   'bg-slate-50 text-slate-700',
  GOLD:     'bg-amber-50 text-amber-700',
  PLATINUM: 'bg-violet-50 text-violet-700',
};

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-500 mx-auto" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg className="w-4 h-4 text-slate-300 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
    </svg>
  );
}

export default function PlanComparisonModal({ plans, isOpen, onClose }) {
  if (!isOpen) return null;

  // Collect all unique feature strings across all plans
  const allFeatures = [];
  const seen = new Set();
  for (const plan of (plans ?? [])) {
    for (const f of (Array.isArray(plan.features) ? plan.features : [])) {
      if (!seen.has(f)) { seen.add(f); allFeatures.push(f); }
    }
  }

  const orderedPlans = (plans ?? []).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-bold text-slate-900">Compare Plans</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 bg-white text-slate-500 font-medium w-40 border-b border-slate-100">Feature</th>
                {orderedPlans.map((plan) => (
                  <th key={plan.id} className={`text-center px-4 py-3 ${TIER_HEADER_STYLES[plan.tier] ?? 'bg-slate-50 text-slate-600'} border-b border-slate-100`}>
                    <div className="font-bold text-sm">{plan.name}</div>
                    <div className="text-xs font-normal opacity-70 mt-0.5">{plan.tagline}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allFeatures.map((feature) => (
                <tr key={feature} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 text-xs">{feature}</td>
                  {orderedPlans.map((plan) => {
                    const planFeatures = Array.isArray(plan.features) ? plan.features : [];
                    const has = planFeatures.includes(feature);
                    return (
                      <td key={plan.id} className="px-4 py-3 text-center">
                        {has ? <CheckIcon /> : <DashIcon />}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {allFeatures.length === 0 && (
                <tr>
                  <td colSpan={orderedPlans.length + 1} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No feature details available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 text-center shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
