/**
 * plansAdminService.js
 *
 * HTTP client for the Plans admin API.
 * Mirrors durationMasterService.js style for auth-aware fetch.
 */

import { api } from './apiClient';
import { tokenStorage } from './tokenStorage';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/**
 * Minimal fetch wrapper that returns the full `{ success, data, meta }` payload
 * without stripping meta. Used for list responses where pagination meta is needed.
 */
async function getRawPayload(path) {
  const token = tokenStorage.getAccess();
  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const err = payload?.error ?? {};
    const e = new Error(err.message ?? `HTTP ${res.status}`);
    e.status = res.status;
    e.code   = err.code ?? 'HTTP_ERROR';
    throw e;
  }
  return payload;
}

export const plansAdminService = {
  /**
   * List plans with pagination, tier/status filter, and search.
   * Returns { records: Plan[], meta }.
   *
   * @param {{ page?: number, limit?: number, search?: string, tier?: string, status?: string }} params
   */
  list: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.page)                              q.set('page',   String(params.page));
    if (params.limit)                             q.set('limit',  String(params.limit));
    if (params.search && params.search.trim())    q.set('search', params.search.trim());
    if (params.tier)                              q.set('tier',   params.tier);
    if (params.status && params.status !== 'ALL') q.set('status', params.status);

    const qs = q.toString();
    const payload = await getRawPayload(`/admin/plans${qs ? '?' + qs : ''}`);
    return {
      records: payload?.data ?? [],
      meta:    payload?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },

  /**
   * Get a single plan by integer ID.
   * @param {number} id
   */
  getById: (id) => api.get(`/admin/plans/${id}`),

  /**
   * Create a new plan with optional pricings array.
   * @param {object} body
   */
  create: (body) => api.post('/admin/plans', body),

  /**
   * Update an existing plan's metadata (partial update).
   * @param {number} id
   * @param {object} body
   */
  update: (id, body) => api.patch(`/admin/plans/${id}`, body),

  /**
   * Set the status of a plan (ACTIVE / INACTIVE).
   * @param {number} id
   * @param {'ACTIVE'|'INACTIVE'} status
   */
  setStatus: (id, status) => api.patch(`/admin/plans/${id}/status`, { status }),

  /**
   * Delete a plan by integer ID.
   * Blocked by the backend if any enrollments reference it.
   * @param {number} id
   */
  remove: (id) => api.delete(`/admin/plans/${id}`),

  /**
   * Upsert a single pricing row for a plan + duration.
   * @param {number} planId
   * @param {number} durationMonths - one of 1/3/6/12
   * @param {object} body
   */
  upsertPricing: (planId, durationMonths, body) =>
    api.put(`/admin/plans/${planId}/pricing/${durationMonths}`, body),

  /**
   * Deactivate (not hard-delete) a specific pricing row.
   * @param {number} planId
   * @param {number} pricingId
   */
  deactivatePricing: (planId, pricingId) =>
    api.delete(`/admin/plans/${planId}/pricing/${pricingId}`),

  /**
   * List enrollments for a plan (paginated).
   * Returns { records: Enrollment[], meta }.
   * @param {number} planId
   * @param {{ page?: number, limit?: number }} params
   */
  listEnrollments: async (planId, params = {}) => {
    const q = new URLSearchParams();
    if (params.page)  q.set('page',  String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    const payload = await getRawPayload(`/admin/plans/${planId}/enrollments${qs ? '?' + qs : ''}`);
    return {
      records: payload?.data ?? [],
      meta:    payload?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  },
};
