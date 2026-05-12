/**
 * adminEnrollmentService.js
 *
 * Auth-aware HTTP client for the admin enrollment endpoints.
 * Mirrors plansAdminService.js style.
 */

import { api } from './apiClient';
import { tokenStorage } from './tokenStorage';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export const adminEnrollmentService = {
  /**
   * Manually create an enrollment (admin-side).
   * @param {object} body
   * @returns {Promise<{ enrollment: object, webhookDelivery: object }>}
   */
  createManual: (body) => api.post('/admin/enrollments/manual', body),

  /**
   * Upload a CSV file for bulk enrollment.
   * Sends multipart/form-data with 'file' and a 'planContext' JSON field.
   * The plan context (course + internal plan + optional coupon + fee breakdown)
   * applies to every row in the CSV.
   *
   * @param {File} file
   * @param {{ courseId: number, internalPlanId: number, couponCode?: string, feeBreakdown?: object }} [planContext]
   * @returns {Promise<{ total: number, success: number, failed: number, rows: object[] }>}
   */
  uploadCsv: async (file, planContext) => {
    const token = tokenStorage.getAccess();
    const headers = {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const form = new FormData();
    form.append('file', file);
    if (planContext) form.append('planContext', JSON.stringify(planContext));

    const res = await fetch(`${BASE_URL}/admin/enrollments/bulk`, {
      method: 'POST',
      headers,
      body: form,
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const err = payload?.error ?? {};
      const e = new Error(err.message ?? `HTTP ${res.status}`);
      e.status = res.status;
      e.code = err.code ?? 'HTTP_ERROR';
      throw e;
    }
    return payload?.data ?? payload;
  },

  /**
   * Download the CSV template by doing an authenticated fetch,
   * converting to a Blob, and triggering a browser download.
   */
  downloadCsvTemplate: async () => {
    const token = tokenStorage.getAccess();
    const headers = {
      Accept: 'text/csv,application/octet-stream,*/*',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE_URL}/admin/enrollments/csv-template`, { headers });
    if (!res.ok) {
      throw new Error(`Failed to download template: HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enrollment-template.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
