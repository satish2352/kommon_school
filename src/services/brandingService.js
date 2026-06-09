import { api } from './apiClient';
import { tokenStorage } from './tokenStorage';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

// The logo is served as a static file from the backend ORIGIN (not under
// /api/v1), so strip the API suffix to build absolute logo URLs.
export const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, '');

/** Turn a stored logo path ("/uploads/branding/x.png") into an absolute URL. */
export function resolveLogoUrl(logoUrl) {
  if (!logoUrl) return null;
  if (/^https?:\/\//i.test(logoUrl)) return logoUrl;
  return `${API_ORIGIN}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
}

export const brandingService = {
  // Public — no auth needed (website reads it before login).
  get: () => api.get('/settings', { auth: false }),

  // Admin/superadmin — update the brand name.
  update: (brandName) => api.put('/settings', { brandName }),

  // Admin/superadmin — upload a new logo (multipart). Raw fetch because the
  // shared apiClient JSON-stringifies bodies.
  uploadLogo: async (file) => {
    const token = tokenStorage.getAccess();
    const form = new FormData();
    form.append('logo', file);
    const res = await fetch(`${BASE_URL}/settings/logo`, {
      method: 'POST',
      headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
    });
    const text = await res.text();
    const payload = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(payload?.error?.message ?? `Logo upload failed: HTTP ${res.status}`);
    return payload?.data ?? payload;
  },
};
