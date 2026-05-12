/**
 * couponValidationService.js
 *
 * Validates a coupon code against an internal plan.
 *
 * SWAP TO REAL BACKEND:
 *   Set USE_MOCK = false — the service will POST to the real backend
 *   endpoint documented in src/services/internalPlans/API_CONTRACT.md
 *   (POST /admin/internal-plans/validate-coupon).
 */

import { api } from './apiClient';
import * as mock from './internalPlans/mockBackend';

const USE_MOCK = true;

/**
 * Validate a coupon code for an internal plan.
 *
 * `basePrice` is the linked course's `courseFee` (the InternalPlan no longer
 * carries its own price). Callers MUST supply it.
 *
 * @param {{ code: string, internalPlanId: number, basePrice: number }} params
 * @returns {Promise<{
 *   valid: boolean,
 *   discountAmount: number,
 *   finalAmount: number,
 *   reason?: string,
 *   coupon?: object
 * }>}
 */
export async function validateCoupon({ code, internalPlanId, basePrice }) {
  if (USE_MOCK) {
    // mock returns plain object (not wrapped in { success, data })
    return mock.validateCoupon({ code, internalPlanId, basePrice });
  }
  return api.post('/admin/internal-plans/validate-coupon', { code, internalPlanId, basePrice });
}
