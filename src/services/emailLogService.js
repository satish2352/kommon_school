/**
 * emailLogService.js
 *
 * Admin HTTP client for the email audit log + onboarding resend.
 * List uses a raw fetch so the `{ data, meta }` pagination envelope is
 * preserved (apiClient's api.get strips it to just `data`). Resend uses the
 * shared api.post (auth header attached automatically).
 */

import { api } from './apiClient';
import { tokenStorage } from './tokenStorage';

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
    e.status = res.status;
    e.code = err.code ?? 'HTTP_ERROR';
    throw e;
  }
  return payload;
}

export const emailLogService = {
  /**
   * Paginated email log.
   * @param {{ page?, limit?, search?, status? }} params
   * @returns {Promise<{ rows, meta }>}
   */
  list: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.search && params.search.trim()) q.set('search', params.search.trim());
    if (params.status) q.set('status', params.status);
    const qs = q.toString();
    const payload = await getRawPayload(`/admin/email-logs${qs ? `?${qs}` : ''}`);
    return {
      rows: payload?.data ?? [],
      meta: payload?.meta ?? { page: 1, limit: 25, total: 0, totalPages: 0 },
    };
  },

  /**
   * Resend onboarding credentials for an email. Resets the password for an
   * existing student account. Returns { to, accountAction, emailStatus, ... }.
   */
  resendOnboarding: (email) => api.post('/admin/email-logs/resend', { email }),
};
