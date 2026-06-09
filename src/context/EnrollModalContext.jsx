import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { savePlanSelection } from '../services/enrollPersistence'

/**
 * EnrollModalContext
 * ------------------
 * Single source of truth for "is the enroll modal open?" plus a typed
 * plan handoff so callers (e.g. PricingTable) can open the modal with a
 * pre-selected plan in one shot.
 *
 * API
 *   open()                            — open with no preselected plan
 *                                       (falls back to in-modal PlanSelector)
 *   openWithPlan(summary)             — open with a preselected plan; the
 *                                       summary is also persisted via
 *                                       enrollPersistence so a refresh
 *                                       keeps the choice.
 *   close()                           — close the modal
 *   isOpen                            — boolean
 *   getPreselectedPlan()              — read the most recent summary
 *                                       passed to openWithPlan(), without
 *                                       clearing it (read multiple times
 *                                       within the same modal session)
 *   consumePreselectedPlan()          — read+clear the preselection (use
 *                                       when the modal has applied it so a
 *                                       second open() without a plan doesn't
 *                                       accidentally reuse the old choice)
 *
 * The `summary` shape (everything optional except planPricingId):
 *   {
 *     planPricingId, planId, planName, tier, durationMonths, durationUnit,
 *     basePrice, discountPercent, finalPrice, discountLabel
 *   }
 *
 * Note: nothing in this context dictates the modal's step machine — the
 * modal decides whether to show "Confirm Plan" (when preselected) or
 * "Choose Plan" (when not). This keeps the context dumb.
 */

const EnrollModalContext = createContext(null)

export function EnrollModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  // useRef instead of useState because consumers don't need to re-render
  // when the preselection changes — they read it once on modal open.
  // (Re-rendering on every plan click on the Pricing page would be wasteful.)
  const preselectedRef = useRef(null)

  const open = useCallback(() => {
    // "Enroll Now" intent — no specific plan in mind. Defensively null
    // any prior preselection so a stale openWithPlan(...) that wasn't
    // yet consumed by the modal effect can't leak into this open. The
    // modal will then render its chooser ("Choose Your Duration & Plan")
    // and the student picks from scratch.
    preselectedRef.current = null
    setIsOpen(true)
  }, [])

  const openWithPlan = useCallback((summary) => {
    if (summary && typeof summary.planPricingId === 'number') {
      preselectedRef.current = summary
      // Persist to localStorage as a side-effect. NOTE: the modal does
      // NOT auto-read this on a plain open() — that's intentional so
      // "Enroll Now" never inherits a stale Pricing-page selection.
      // The persistence is retained for future surfaces (e.g. a
      // "Resume your last incomplete enrollment" prompt) that may
      // explicitly opt into restoring it.
      savePlanSelection(summary)
    }
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const getPreselectedPlan = useCallback(() => preselectedRef.current, [])

  const consumePreselectedPlan = useCallback(() => {
    const v = preselectedRef.current
    preselectedRef.current = null
    return v
  }, [])

  return (
    <EnrollModalContext.Provider
      value={{
        isOpen,
        open,
        openWithPlan,
        close,
        getPreselectedPlan,
        consumePreselectedPlan,
      }}
    >
      {children}
    </EnrollModalContext.Provider>
  )
}

export const useEnrollModal = () => useContext(EnrollModalContext)
