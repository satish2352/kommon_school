/**
 * courseNameService.js
 *
 * HTTP client for the Course Name Master admin API.
 * Mirrors durationMasterService.js.
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

export const courseNameService = {
  /**
   * List course name master records with pagination, search, and status filter.
   * Returns { records: CourseNameMaster[], meta }.
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
    const payload = await getRawPayload(`/admin/course-names${qs ? '?' + qs : ''}`);
    return {
      records: payload?.data ?? [],
      meta:    payload?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },

  /**
   * Convenience: return only ACTIVE records for dropdown population.
   * @returns {Promise<CourseNameMaster[]>}
   */
  listActive: async () => {
    const { records } = await courseNameService.list({ status: 'ACTIVE', limit: 100 });
    return records;
  },

  /**
   * Get a single course name master record by integer ID.
   * @param {number} id
   */
  getById: (id) => api.get(`/admin/course-names/${id}`),

  /**
   * Create a new course name master record.
   * @param {{ name: string, description?: string, status?: string }} body
   */
  create: (body) => api.post('/admin/course-names', body),

  /**
   * Update an existing course name master record (partial update).
   * @param {number} id
   * @param {object} body
   */
  update: (id, body) => api.patch(`/admin/course-names/${id}`, body),

  /**
   * Hard-delete a course name master record by ID.
   * @param {number} id
   */
  remove: (id) => api.delete(`/admin/course-names/${id}`),
};
