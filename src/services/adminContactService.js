/**
 * adminContactService.js
 *
 * Auth-aware client for the admin contact-messages endpoints.
 */
import { api } from './apiClient';
import { tokenStorage } from './tokenStorage';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

// Raw fetch that preserves the `{ success, data, meta }` envelope (needed for
// pagination meta, which api.get strips).
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
    e.code = err.code ?? 'HTTP_ERROR';
    throw e;
  }
  return payload;
}

export const adminContactService = {
  /**
   * List contact submissions. Returns { records, meta }.
   * @param {{ page?, limit?, search?, status? }} params
   */
  list: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.page)                              q.set('page',   String(params.page));
    if (params.limit)                             q.set('limit',  String(params.limit));
    if (params.search && params.search.trim())    q.set('search', params.search.trim());
    if (params.status && params.status !== 'ALL') q.set('status', params.status);
    const qs = q.toString();
    const payload = await getRawPayload(`/admin/contact-messages${qs ? '?' + qs : ''}`);
    return {
      records: payload?.data ?? [],
      meta:    payload?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  /**
   * Update a submission's status.
   * @param {string} id
   * @param {'NEW'|'READ'|'REPLIED'|'SPAM'|'ARCHIVED'} status
   */
  updateStatus: (id, status) => api.patch(`/admin/contact-messages/${id}/status`, { status }),
};
