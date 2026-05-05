import { api } from './apiClient';

const qs = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
};

export const followupService = {
  list: (filters) => api.get(`/follow-ups${qs(filters)}`),
  get: (id) => api.get(`/follow-ups/${id}`),
  create: (body) => api.post('/follow-ups', body),
  addInteraction: (id, body) => api.post(`/follow-ups/${id}/interactions`, body),
  addNote: (id, body) => api.post(`/follow-ups/${id}/notes`, body),
  updateStatus: (id, body) => api.patch(`/follow-ups/${id}/status`, body),
};
