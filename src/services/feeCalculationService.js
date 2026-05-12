/**
 * feeCalculationService.js
 *
 * Calculates fee breakdown for an internal plan with optional coupon.
 *
 * SWAP TO REAL BACKEND:
 *   Set USE_MOCK = false — the service will POST to the real backend
 *   endpoint documented in src/services/internalPlans/API_CONTRACT.md
 *   (POST /admin/internal-plans/calculate-fee).
 */

import { api } from './apiClient';
import * as mock from './internalPlans/mockBackend';

const USE_MOCK = true;

/**
 * Calculate fee breakdown for an internal plan.
 *
 * `basePrice` is the linked course's `courseFee` (the InternalPlan no longer
 * carries its own price). Callers MUST supply it.
 *
 * @param {{ internalPlanId: number, basePrice: number, couponCode?: string }} params
 * @returns {Promise<{
 *   basePrice:    number,
 *   discount:     number,
 *   finalAmount:  number,
 *   couponValid?: boolean,
 *   couponReason?: string,
 *   breakdown:    Array<{ label: string, amount: number }>
 * }>}
 */
export async function calculate({ internalPlanId, basePrice, couponCode }) {
  if (USE_MOCK) {
    // mock.calculateFee returns { success, data } — unwrap .data
    const result = mock.calculateFee({ internalPlanId, basePrice, couponCode });
    return result?.data ?? result;
  }
  return api.post('/admin/internal-plans/calculate-fee', { internalPlanId, basePrice, couponCode });
}
