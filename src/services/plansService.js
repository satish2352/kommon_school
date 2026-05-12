/**
 * plansService.js
 *
 * Public HTTP client for the Plans API (no auth required).
 * Used by the public marketing site for plan selection during enrollment.
 */

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/**
 * Shared fetch wrapper — no auth header required for public endpoints.
 * Throws a structured error on non-2xx responses.
 */
async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw Object.assign(new Error('Network error'), { code: 'NETWORK_ERROR' });
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (json && json.error && json.error.message) || `API error ${response.status}`;
    throw Object.assign(new Error(message), {
      status: response.status,
      code:   json?.error?.code ?? 'API_ERROR',
    });
  }

  return json;
}

/**
 * List all ACTIVE plans with ACTIVE pricings.
 * @returns {Promise<object[]>}
 */
export async function listPublic() {
  const res = await apiFetch('/plans');
  return res?.data ?? [];
}

/**
 * Get a single plan by integer ID.
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function getById(id) {
  const res = await apiFetch(`/plans/${id}`);
  return res?.data ?? res;
}

/**
 * Select a plan pricing for an enrollment.
 * Calls PATCH /api/v1/enrollments/:enrollmentId/plan.
 * @param {string} enrollmentId - UUID of the enrollment
 * @param {number} planPricingId - integer PK of the selected PlanPricing
 * @returns {Promise<{ enrollment: object, planPricing: object }>}
 */
export async function selectForEnrollment(enrollmentId, planPricingId) {
  const res = await apiFetch(`/enrollments/${encodeURIComponent(enrollmentId)}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ planPricingId }),
  });
  return res?.data ?? res;
}
