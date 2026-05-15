/**
 * webhookAdminService.js
 *
 * HTTP client for the Webhook Delivery admin API.
 * All endpoints require a valid admin Bearer token (handled automatically
 * by apiClient.js for single-resource calls).
 *
 * For list/stats endpoints, uses a raw fetch so that both `data` and `meta`
 * from the backend response `{ success, data, meta }` are preserved —
 * apiClient's `api.get` strips the outer envelope to just `data`.
 */

import { api } from './apiClient';
import { tokenStorage } from './tokenStorage';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/**
 * Minimal fetch wrapper that returns the full `{ success, data, meta }` payload
 * without stripping. Used for list/stats responses.
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

export const webhookAdminService = {
  /**
   * List webhook deliveries with pagination, search, status, and source filters.
   * Returns { deliveries: WebhookDelivery[], meta: { page, limit, total, totalPages } }.
   *
   * @param {{ page?: number, limit?: number, search?: string, status?: string, source?: string }} params
   */
  listDeliveries: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.page)                            q.set('page',   String(params.page));
    if (params.limit)                           q.set('limit',  String(params.limit));
    if (params.search && params.search.trim())  q.set('search', params.search.trim());
    if (params.status)                          q.set('status', params.status);
    if (params.source)                          q.set('source', params.source);

    const qs = q.toString();
    const payload = await getRawPayload(`/webhooks/deliveries${qs ? '?' + qs : ''}`);
    return {
      deliveries: payload?.data  ?? [],
      meta:       payload?.meta  ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  },

  /**
   * Get a single delivery by integer ID.
   * @param {number} id
   */
  getDelivery: (id) => api.get(`/webhooks/deliveries/${id}`),

  /**
   * Get aggregated stats (total, successful, failed, networkError, last24h, last7d).
   */
  getStats: async () => {
    const payload = await getRawPayload('/webhooks/stats');
    return payload?.data ?? {
      total: 0,
      successful: 0,
      failed: 0,
      networkError: 0,
      last24h: 0,
      last7d: 0,
    };
  },

  /**
   * Fire a test webhook from the admin panel (server-side).
   * Returns the persisted WebhookDelivery row.
   *
   * @param {{ enrollment, order, rzpResponse }} sample — matching TEST_SAMPLES shape
   */
  sendTestWebhook: (sample) => api.post('/webhooks/test', sample),

  /**
   * Check whether the Sumago integration is configured on the backend.
   * Returns { enabled: boolean, baseUrl: string|null }. NEVER returns the token.
   */
  getSumagoConfig: () => api.get('/webhooks/sumago/config'),

  /**
   * Proxy fetch users from the Sumago "Retrieve User Data & Status" endpoint.
   * The Bearer token lives only on the backend.
   * Returns: { status, organizationCode, totalUsers, users: [...] }.
   */
  fetchSumagoUsers: () => api.get('/webhooks/sumago/users'),
};
