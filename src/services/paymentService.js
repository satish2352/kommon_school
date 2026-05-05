import { api } from './apiClient';

export const paymentService = {
  heartbeat: (paymentId) => api.post(`/payments/${paymentId}/heartbeat`, {}),
  refund: ({ paymentId, amount, reason }, idempotencyKey) =>
    api.post(`/payments/${paymentId}/refund`, { amount, reason }, { idempotencyKey }),
  getById: (paymentId) => api.get(`/payments/${paymentId}`),
};
