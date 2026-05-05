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
  listPayments: (filters) => api.get(`/admin/payments${qs(filters)}`),
  listFailedPayments: (filters) => api.get(`/admin/payments/failed${qs(filters)}`),
  listExternalApiLogs: (filters) => api.get(`/admin/external-api-logs${qs(filters)}`),
  getFollowUpReport: (filters) => api.get(`/admin/follow-ups/report${qs(filters)}`),
};
