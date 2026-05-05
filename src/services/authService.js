import { api } from './apiClient';

export const authService = {
  login: async ({ email, password, tenantId }) => {
    const headers = tenantId ? { 'X-Tenant-Id': tenantId } : undefined;
    return api.post('/auth/login', { email, password }, { auth: false, headers });
  },
  logout: () => api.post('/auth/logout', {}),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }, { auth: false }),
  changePassword: ({ currentPassword, newPassword }) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};
