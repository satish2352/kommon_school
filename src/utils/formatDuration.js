/**
 * formatDuration — render a pricing duration value + unit as a human label.
 *
 * Plan pricing stores a numeric `durationMonths` (the value) plus a
 * `durationUnit` of 'DAYS' or 'MONTHS'. Older rows have no unit → default to
 * months for backward compatibility.
 *
 * @param {number|string} value - the numeric duration value
 * @param {'DAYS'|'MONTHS'} [unit='MONTHS']
 * @param {string} [fallback='—'] - returned when value is missing/invalid
 * @returns {string}
 */
export function formatDuration(value, unit = 'MONTHS', fallback = '—') {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  const u = String(unit || 'MONTHS').toUpperCase();
  if (u === 'DAYS') return n === 1 ? '1 Day' : `${n} Days`;
  return n === 1 ? '1 Month' : `${n} Months`;
}
