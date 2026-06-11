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
   * Admin "New Enrollment" wizard, internal-flow endpoint.
   * Backend recomputes pricing from internalPlanId + courseId + couponCode.
   * Fee values in the body are silently dropped by the validator.
   *
   * Coupon usage-limit error code: 'COUPON_USAGE_LIMIT_REACHED'.
   *
   * @param {{
   *   name, email, phone, role,
   *   education?, readiness?, source?,
   *   courseId, internalPlanId, internalCouponCode?, notes?,
   * }} body
   * @returns {Promise<{ enrollment, webhookDelivery }>}
   */
  createInternal: (body) => api.post('/admin/enrollments/internal', body),

  /**
   * Check whether an email is already registered (has any existing enrollment).
   * Reuses the grouped-by-email history endpoint with limit=1 — we only need
   * the `total` count and a sample row, not the full list.
   *
   * @param {string} email
   * @returns {Promise<{ email, total, items, currentPlan }>}
   */
  checkEmail: (email) =>
    api.get(`/admin/enrollments/by-email?email=${encodeURIComponent(email)}&limit=1`),

  /**
   * Fetch a single enrollment's full detail (student + internal plan + course
   * + payments) by its numeric id. Used by the renewal flow to pre-fill from
   * an existing record.
   * @param {number|string} id
   */
  getById: (id) => api.get(`/admin/enrollments/${id}`),

  /**
   * Find the most recent enrollment for an email (newest first). Returns the
   * compact history row plus the total count — used to seed the Renewal flow.
   * @param {string} email
   * @returns {Promise<{ total: number, latest: object|null, currentPlan: object|null }>}
   */
  findLatestByEmail: async (email) => {
    const res = await api.get(
      `/admin/enrollments/by-email?email=${encodeURIComponent(email)}&limit=1`,
    );
    return {
      total:       res?.total ?? 0,
      latest:      res?.items?.[0] ?? null,
      currentPlan: res?.currentPlan ?? null,
    };
  },

  /**
   * Save Step-1 of the admin "+ New Enrollment" wizard as an unpaid
   * draft so the lead is captured for Follow-Ups even if admin closes
   * the tab before completing Step 3.
   *
   * Echo the returned `enrollmentId` back as `draftEnrollmentId` on
   * subsequent calls so the same draft is updated in place instead of
   * creating a duplicate when the admin steps back and forward.
   *
   * @param {{
   *   name, email, phone, role,
   *   education?, readiness?, source?, notes?,
   *   draftEnrollmentId?,
   * }} body
   * @returns {Promise<{ enrollmentId, enrollmentCode, drafted: true }>}
   */
  saveDraft: (body) => api.post('/admin/enrollments/draft', body),

  /**
   * Manually create an enrollment (admin-side, legacy planTier path).
   * Kept for any code still posting the old shape; new code should use
   * createInternal().
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
