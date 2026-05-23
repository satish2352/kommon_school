import { api } from './apiClient';

const qs = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  listEnrollments: (filters) => api.get(`/admin/enrollments${qs(filters)}`),
  /**
   * Single-enrollment detail for the InternalEnrollments drawer.
   * Returns enrollment + internalPlan + course + ALL payments + the
   * financial snapshot fields.
   */
  getEnrollmentById: (id) => api.get(`/admin/enrollments/${encodeURIComponent(id)}`),
  /**
   * Re-queue the external-API sync for an enrollment whose
   * external_sync_status is FAILED or DEAD_LETTER. Returns
   * { enrollmentId, externalSyncStatus, jobId }.
   */
  retrySyncEnrollment: (id) =>
    api.post(`/admin/enrollments/${encodeURIComponent(id)}/retry-sync`),
  listPayments: (filters) => api.get(`/admin/payments${qs(filters)}`),
  listFailedPayments: (filters) => api.get(`/admin/payments/failed${qs(filters)}`),
  listExternalApiLogs: (filters) => api.get(`/admin/external-api-logs${qs(filters)}`),
  getFollowUpReport: (filters) => api.get(`/admin/follow-ups/report${qs(filters)}`),
};
