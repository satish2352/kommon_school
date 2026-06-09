/**
 * enrollPersistence.js
 *
 * Refresh- and tab-close-safe storage for the public enrollment flow.
 *
 * What we persist
 * ---------------
 *   - planSelection : the plan the student picked on the Pricing Page
 *     (planPricingId + display summary). Persisted at "Get Started" time
 *     so that opening the EnrollModal later restores the same selection.
 *   - enrollmentId  : the UUID returned by POST /enrollments. Persisted
 *     after step 1 of the modal so a refresh in the middle of the flow
 *     does not start a brand-new enrollment row.
 *
 * What we DO NOT persist
 * ----------------------
 *   - Pricing numbers (basePrice / finalPrice / discountPercent) are kept
 *     in the summary for display ONLY. They are never sent to the backend
 *     for actual order creation; the backend re-resolves them from the DB
 *     using the planPricingId, so a malicious user editing localStorage
 *     cannot change what they get charged.
 *   - PII (email/phone/name). Form fields stay in component state; the
 *     student re-enters them on reopen. The "resume by email" path in
 *     enrollment.service.js means the backend still finds the prior
 *     incomplete enrollment from the email itself, so persisting the
 *     enrollmentId is purely an optimisation.
 *
 * TTL
 * ---
 * 24 hours from last write. Anything older is treated as not-present.
 * Why 24h: long enough to cover "I closed the tab and came back tomorrow",
 * short enough that we don't keep stale plan selections forever (plans
 * can be deactivated by admins; a week-old persisted selection would just
 * fail re-validation at modal-open time anyway).
 *
 * Storage choice
 * --------------
 * sessionStorage is per-tab and cleared on tab close — we use
 * localStorage because the flow must survive a tab close + reopen (and
 * even browser restart on most platforms). The TTL bounds the staleness
 * problem that localStorage's infinite lifetime would otherwise create.
 *
 * Safe defaults
 * -------------
 * All reads silently return null on any error (storage disabled, JSON
 * parse failure, schema drift). All writes silently swallow exceptions
 * (private-browsing modes throw on writes). The flow must never break
 * because persistence is unavailable — it's a UX enhancement only.
 */

const STORAGE_KEY = 'kommon_enroll_v1';
const TTL_MS = 24 * 60 * 60 * 1000;

function nowMs() {
  return Date.now();
}

/**
 * Read the raw persisted blob, returning {} on any failure or if expired.
 * Expiry is checked at read-time so we don't need a sweeper job.
 *
 * @returns {{ planSelection?: object, enrollmentId?: string, expiresAt?: number }}
 */
function readBlob() {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    if (typeof parsed.expiresAt !== 'number' || parsed.expiresAt < nowMs()) {
      // Stale — clear on the way out so we don't keep returning empty
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

/**
 * Write the blob back, refreshing the TTL.
 * Silently no-ops on any storage failure (e.g. Safari private mode).
 */
function writeBlob(blob) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const next = { ...blob, expiresAt: nowMs() + TTL_MS };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/**
 * Persist the plan the student picked on the Pricing Page.
 *
 * @param {{
 *   planPricingId:   number,
 *   planId?:         number,
 *   planName?:       string,
 *   tier?:           string,
 *   durationMonths?: number,
 *   durationUnit?:   string,
 *   basePrice?:      number,
 *   discountPercent?:number,
 *   finalPrice?:     number,
 *   discountLabel?:  string|null,
 * }} summary
 */
export function savePlanSelection(summary) {
  if (!summary || typeof summary.planPricingId !== 'number') return;
  const blob = readBlob();
  writeBlob({
    ...blob,
    planSelection: {
      planPricingId:   summary.planPricingId,
      planId:          summary.planId ?? null,
      planName:        summary.planName ?? null,
      tier:            summary.tier ?? null,
      durationMonths:  summary.durationMonths ?? null,
      durationUnit:    summary.durationUnit ?? 'MONTHS',
      basePrice:       summary.basePrice ?? null,
      discountPercent: summary.discountPercent ?? null,
      finalPrice:      summary.finalPrice ?? null,
      discountLabel:   summary.discountLabel ?? null,
      selectedAt:      nowMs(),
    },
  });
}

/** Returns the persisted plan summary, or null if none / expired. */
export function loadPlanSelection() {
  const { planSelection } = readBlob();
  return planSelection || null;
}

/** Clears just the plan selection (e.g. user explicitly picked "change plan"). */
export function clearPlanSelection() {
  const blob = readBlob();
  if (!blob.planSelection) return;
  // Preserve enrollmentId; only drop the plan piece.
  // eslint-disable-next-line no-unused-vars
  const { planSelection, ...rest } = blob;
  writeBlob(rest);
}

/**
 * Persist the enrollment UUID after step-1 submission so a refresh keeps
 * working against the same row instead of creating a sibling.
 *
 * @param {string} enrollmentId UUID returned by POST /enrollments
 */
export function saveEnrollmentId(enrollmentId) {
  if (typeof enrollmentId !== 'string' || enrollmentId.length === 0) return;
  const blob = readBlob();
  writeBlob({ ...blob, enrollmentId });
}

/** Returns the persisted enrollment UUID, or null if none / expired. */
export function loadEnrollmentId() {
  const { enrollmentId } = readBlob();
  return enrollmentId || null;
}

/**
 * Hard-clear everything (call after successful payment, "start over",
 * or when the persisted plan failed re-validation and the user explicitly
 * chose a fresh path).
 */
export function clearEnrollPersistence() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

/**
 * Re-validate a previously-persisted plan against a freshly-loaded plans
 * list. Returns one of:
 *   { status: 'valid',    pricing, plan }
 *   { status: 'changed',  pricing, plan }       — price/discount differs
 *   { status: 'inactive', pricing, plan }       — pricing or plan no longer ACTIVE
 *   { status: 'missing' }                        — id no longer found
 *
 * Why this lives here: every consumer of `loadPlanSelection()` should
 * run this check before showing a "Confirm Plan" screen, so we centralise
 * the comparison logic in one place.
 *
 * @param {object|null} planSelection — return value of loadPlanSelection()
 * @param {object[]}    plans         — return value of listPublic()
 */
export function revalidatePlanSelection(planSelection, plans) {
  if (!planSelection || typeof planSelection.planPricingId !== 'number') {
    return { status: 'missing' };
  }
  if (!Array.isArray(plans) || plans.length === 0) {
    return { status: 'missing' };
  }

  // Walk the plans list (3–10 plans max) to find the pricing by id.
  // O(N*M) where N=plans, M=pricings — both single digits; no need to
  // build a Map.
  for (const plan of plans) {
    const pricings = Array.isArray(plan.pricings) ? plan.pricings : [];
    const pricing = pricings.find((p) => p.id === planSelection.planPricingId);
    if (!pricing) continue;

    if (plan.status !== 'ACTIVE' || pricing.status !== 'ACTIVE') {
      return { status: 'inactive', pricing, plan };
    }

    // Compare meaningful display fields. Pricing is a Decimal coming from
    // the API as a string in some setups, so Number()-coerce both sides.
    const liveFinal = Number(pricing.finalPrice);
    const cachedFinal = Number(planSelection.finalPrice);
    const liveDiscount = Number(pricing.discountPercent);
    const cachedDiscount = Number(planSelection.discountPercent);

    const changed =
      Number.isFinite(cachedFinal) && Math.abs(liveFinal - cachedFinal) > 0.001 ||
      Number.isFinite(cachedDiscount) && Math.abs(liveDiscount - cachedDiscount) > 0.001 ||
      pricing.durationMonths !== planSelection.durationMonths ||
      (pricing.durationUnit ?? 'MONTHS') !== (planSelection.durationUnit ?? 'MONTHS');

    return { status: changed ? 'changed' : 'valid', pricing, plan };
  }

  return { status: 'missing' };
}
