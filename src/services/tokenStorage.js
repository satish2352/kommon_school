const ACCESS_KEY = 'kommon.accessToken';
const REFRESH_KEY = 'kommon.refreshToken';
const USER_KEY = 'kommon.user';
const TENANT_KEY = 'kommon.tenantId';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getTenantId: () => localStorage.getItem(TENANT_KEY) || null,
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  setSession: ({ accessToken, refreshToken, user, tenantId }) => {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (tenantId) localStorage.setItem(TENANT_KEY, tenantId);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TENANT_KEY);
  },
};
