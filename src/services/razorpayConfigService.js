/**
 * razorpayConfigService.js
 *
 * HTTP client for the Razorpay gateway-configuration admin API.
 * Superadmin-only (backend enforces `razorpay_configs:manage`).
 *
 * Secrets (key_secret / webhook_secret) are write-only: they are encrypted at
 * rest and NEVER returned by the API. List/get responses expose only
 * { id, key_id, is_active, created_at, updated_at }.
 */

import { api } from './apiClient';

export const razorpayConfigService = {
  /**
   * List all configs (newest first). Returns an array of masked configs.
   * Configs are few, so we fetch a generous page and skip UI pagination.
   */
  list: () => api.get('/admin/razorpay-configs?limit=100&sortBy=created_at&sortOrder=desc'),

  /**
   * Create a new (inactive) config.
   * @param {{ key_id: string, key_secret: string, webhook_secret: string }} body
   */
  create: (body) => api.post('/admin/razorpay-configs', body),

  /**
   * Make a config the single active gateway (deactivates all others atomically).
   * @param {string} id
   */
  activate: (id) => api.patch(`/admin/razorpay-configs/${id}/activate`),

  /**
   * Delete a config. The backend refuses (409) if it is currently active.
   * @param {string} id
   */
  remove: (id) => api.delete(`/admin/razorpay-configs/${id}`),
};
