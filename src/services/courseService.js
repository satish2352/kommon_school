/**
 * courseService.js
 *
 * HTTP client for the Course Master admin API.
 * All endpoints require a valid admin Bearer token (handled automatically
 * by apiClient.js for single-resource calls).
 *
 * For the list endpoint, uses a raw fetch so that both `data` and `meta`
 * from the backend response `{ success, data, meta }` are preserved —
 * apiClient's `api.get` strips the outer envelope to just `data`.
 */

import { api } from './apiClient';
import { tokenStorage } from './tokenStorage';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/**
 * Minimal fetch wrapper that returns the full `{ success, data, meta }` payload
 * without stripping. Used for list responses where meta is needed.
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

export const courseService = {
  /**
   * List courses with pagination, search, and status filter.
   * Returns { courses: Course[], meta: { page, limit, total, totalPages } }.
   *
   * @param {{ page?: number, limit?: number, search?: string, status?: string }} params
   */
  list: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.page)                              q.set('page',   String(params.page));
    if (params.limit)                             q.set('limit',  String(params.limit));
    if (params.search && params.search.trim())    q.set('search', params.search.trim());
    if (params.status && params.status !== 'ALL') q.set('status', params.status);

    const qs = q.toString();
    const payload = await getRawPayload(`/courses${qs ? '?' + qs : ''}`);
    return {
      courses: payload?.data  ?? [],
      meta:    payload?.meta  ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },

  /**
   * Get a single course by integer ID.
   * @param {number} id
   */
  getById: (id) => api.get(`/courses/${id}`),

  /**
   * Create a new course.
   * @param {{ nameOfCourseAsGroup: string, courseFee: number, coupon?: string,
   *            description?: string, duration?: string, status?: string }} body
   */
  create: (body) => api.post('/courses', body),

  /**
   * Update an existing course (partial update).
   * @param {number} id
   * @param {object} body - any subset of course fields
   */
  update: (id, body) => api.patch(`/courses/${id}`, body),

  /**
   * Hard-delete a course by ID.
   * @param {number} id
   */
  remove: (id) => api.delete(`/courses/${id}`),
};
