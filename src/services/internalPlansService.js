/**
 * internalPlansService.js
 *
 * HTTP-shaped client for the Internal Plans API.
 *
 * SWAP TO REAL BACKEND:
 *   Set USE_MOCK = false and the service will call the real apiClient
 *   at the endpoints documented in src/services/internalPlans/API_CONTRACT.md.
 *
 * When USE_MOCK is true, all calls are routed to the localStorage-backed
 * mockBackend.js — no network traffic.
 */

import { api } from './apiClient';
import { tokenStorage } from './tokenStorage';
import * as mock from './internalPlans/mockBackend';

/* ─── Toggle ────────────────────────────────────────────────────────────── */

const USE_MOCK = false;

/* ─── Real-backend helpers (mirroring courseService.js / plansAdminService.js) ── */

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

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
    e.status  = res.status;
    e.code    = err.code ?? 'HTTP_ERROR';
    throw e;
  }
  return payload;
}

/* ─── Mock adapter ──────────────────────────────────────────────────────── */

/**
 * Unwrap a mock response { success, data, meta } the same way apiClient does.
 * For list calls we return { data, meta }; for single-resource calls we return data.
 */
function unwrap(result) {
  // result is { success: true, data, meta? }
  return result?.data ?? result;
}

function unwrapList(result) {
  return {
    data: result?.data ?? [],
    meta: result?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

/* ─── Service ───────────────────────────────────────────────────────────── */

export const internalPlansService = {
  /**
   * List internal plans with search/filter/pagination.
   * Returns { data: InternalPlan[], meta }.
   *
   * @param {{ page?: number, limit?: number, search?: string, courseId?: number, status?: string }} params
   */
  list: async (params = {}) => {
    if (USE_MOCK) {
      const result = mock.listPlans(params);
      return unwrapList(result);
    }
    const q = new URLSearchParams();
    if (params.page)                              q.set('page',     String(params.page));
    if (params.limit)                             q.set('limit',    String(params.limit));
    if (params.search && params.search.trim())    q.set('search',   params.search.trim());
    if (params.courseId)                          q.set('courseId', String(params.courseId));
    if (params.status && params.status !== 'ALL') q.set('status',   params.status);
    const qs = q.toString();
    const payload = await getRawPayload(`/admin/internal-plans${qs ? '?' + qs : ''}`);
    return {
      data: payload?.data ?? [],
      meta: payload?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  /**
   * Get a single internal plan by ID.
   * @param {number} id
   */
  getById: async (id) => {
    if (USE_MOCK) return unwrap(mock.getPlanById(id));
    return api.get(`/admin/internal-plans/${id}`);
  },

  /**
   * Create a new internal plan.
   * @param {object} body
   */
  create: async (body) => {
    if (USE_MOCK) return unwrap(mock.createPlan(body));
    return api.post('/admin/internal-plans', body);
  },

  /**
   * Update an existing internal plan (partial update).
   * @param {number} id
   * @param {object} body
   */
  update: async (id, body) => {
    if (USE_MOCK) return unwrap(mock.updatePlan(id, body));
    return api.patch(`/admin/internal-plans/${id}`, body);
  },

  /**
   * Set plan status.
   * @param {number} id
   * @param {'ACTIVE'|'INACTIVE'} status
   */
  setStatus: async (id, status) => {
    if (USE_MOCK) return unwrap(mock.setPlanStatus(id, status));
    return api.patch(`/admin/internal-plans/${id}/status`, { status });
  },

  /**
   * Delete a plan by ID.
   * @param {number} id
   */
  remove: async (id) => {
    if (USE_MOCK) { mock.removePlan(id); return null; }
    return api.delete(`/admin/internal-plans/${id}`);
  },

  /**
   * List active plans for a course (for dropdowns).
   * @param {number} courseId
   */
  listByCourse: async (courseId) => {
    if (USE_MOCK) return unwrap(mock.listByCourse(courseId));
    return api.get(`/admin/internal-plans/by-course/${courseId}`);
  },
};
