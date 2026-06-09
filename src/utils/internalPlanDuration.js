/**
 * internalPlanDuration — resolve an internal plan's REAL duration.
 *
 * Internal plans store only a hardcoded duration enum (always 6_MONTHS), so the
 * actual plan length is encoded in the Plan ID code instead, e.g.
 *   "SUMAGOTEST_SCOPE_30DAYS"  -> "30 Days"
 *   "SUMAGOTEST_SCOPE_3MONTHS" -> "3 Months"
 * Mirrors backend/src/utils/planDuration.js so every admin screen agrees.
 */

const ENUM_MONTHS = {
  '1_MONTH': 1, '3_MONTHS': 3, '6_MONTHS': 6, '12_MONTHS': 12,
  ONE_MONTH: 1, THREE_MONTHS: 3, SIX_MONTHS: 6, TWELVE_MONTHS: 12,
};

/**
 * Extract { value, unit } from a Plan ID code using its last number+unit token
 * (so year-like prefixes are ignored). Returns null when there's no token.
 */
export function parseDurationFromPlanId(planId) {
  if (!planId) return null;
  const matches = [...String(planId).matchAll(/(\d+(?:\.\d+)?)\s*_?\s*(DAYS?|MONTHS?)/gi)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1];
  const value = Number(last[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return { value, unit: /^MONTH/i.test(last[2]) ? 'MONTHS' : 'DAYS' };
}

/**
 * Human label for an internal plan's actual duration (e.g. "30 Days"): parsed
 * from the Plan ID when possible, else the legacy enum, else the raw value.
 * @param {{ externalPlanId?:string, duration?:string }|null|undefined} plan
 * @returns {string|null}
 */
export function internalDurationLabel(plan) {
  const parsed = parseDurationFromPlanId(plan?.externalPlanId);
  if (parsed) {
    const u = parsed.unit === 'DAYS' ? 'Day' : 'Month';
    return `${parsed.value} ${u}${parsed.value === 1 ? '' : 's'}`;
  }
  const m = ENUM_MONTHS[plan?.duration];
  if (m != null) return `${m} Month${m === 1 ? '' : 's'}`;
  return plan?.duration ?? null;
}
