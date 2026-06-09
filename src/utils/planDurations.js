/**
 * planDurations — derive the duration tab strip from live plan pricing data.
 *
 * The admin panel (PlanForm) lets staff configure ANY duration per plan —
 * any positive integer in DAYS or MONTHS. The public surfaces (pricing page,
 * enroll modal, upgrade link, student "Buy a Plan") must therefore render
 * their duration tabs from the actual `plan.pricings` rows rather than a
 * hardcoded [1,3,6,12] list, so adding/removing a duration in the admin
 * panel changes every customer-facing surface automatically.
 */

import { formatDuration } from './formatDuration';

/**
 * Stable key identifying a duration by both its numeric value and its unit,
 * so "30 Days" and "1 Month" (or "6 Days" and "6 Months") never collide.
 *
 * @param {{durationMonths:number|string, durationUnit?:string}} pricing
 * @returns {string} e.g. "3-MONTHS" / "30-DAYS"
 */
export function pricingKey(pricing) {
  const value = Number(pricing?.durationMonths);
  const unit = String(pricing?.durationUnit || 'MONTHS').toUpperCase();
  return `${value}-${unit}`;
}

/**
 * Build the ordered, de-duplicated list of duration tabs that have at least
 * one ACTIVE pricing across the given plans. Source of truth = admin config.
 *
 * @param {Array<{pricings?: Array}>} plans
 * @returns {Array<{ value:number, unit:string, key:string, label:string }>}
 *          sorted shortest → longest (days normalised to ~months for ordering)
 */
export function getDurationTabs(plans = []) {
  const map = new Map();
  for (const plan of plans ?? []) {
    for (const pr of plan.pricings ?? []) {
      if (pr.status !== 'ACTIVE') continue;
      const value = Number(pr.durationMonths);
      if (!Number.isFinite(value) || value <= 0) continue;
      const unit = String(pr.durationUnit || 'MONTHS').toUpperCase();
      const key = `${value}-${unit}`;
      if (!map.has(key)) {
        map.set(key, { value, unit, key, label: formatDuration(value, unit) });
      }
    }
  }
  // Order by approximate length so a "30 Days" tab sits next to "1 Month".
  const toDays = (t) => (t.unit === 'DAYS' ? t.value : t.value * 30);
  return [...map.values()].sort((a, b) => toDays(a) - toDays(b));
}

/**
 * Pick the initial tab key: prefer one matching `preferMonths` (in MONTHS),
 * else fall back to the first (shortest) available tab. Returns null when
 * there are no tabs yet (plans still loading).
 *
 * @param {Array<{value:number, unit:string, key:string}>} tabs
 * @param {number} [preferMonths=1]
 * @returns {string|null}
 */
export function defaultDurationKey(tabs, preferMonths = 1) {
  if (!tabs || tabs.length === 0) return null;
  const preferred = tabs.find((t) => t.unit === 'MONTHS' && t.value === preferMonths);
  return (preferred ?? tabs[0]).key;
}
