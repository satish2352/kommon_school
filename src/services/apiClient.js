import { tokenStorage } from './tokenStorage';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let onUnauthorizedHandler = null;

export const setOnUnauthorized = (fn) => {
  onUnauthorizedHandler = fn;
};

export async function apiFetch(path, { method = 'GET', body, headers, auth = true, idempotencyKey } = {}) {
  const finalHeaders = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(headers ?? {}),
  };

  if (auth) {
    const token = tokenStorage.getAccess();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
    const tenantId = tokenStorage.getTenantId();
    if (tenantId) finalHeaders['X-Tenant-Id'] = tenantId;
  }

  if (idempotencyKey) finalHeaders['Idempotency-Key'] = idempotencyKey;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let payload = null;
  const text = await res.text();
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
  }

  if (!res.ok) {
    if (res.status === 401 && onUnauthorizedHandler) onUnauthorizedHandler();
    const err = payload?.error ?? {};
    throw new ApiError(res.status, err.code ?? 'HTTP_ERROR', err.message ?? `HTTP ${res.status}`, err.details ?? null);
  }

  // backend convention: { success, data } or { success, message }
  return payload?.data ?? payload;
}

export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => apiFetch(path, { ...opts, method: 'PATCH', body }),
  put: (path, body, opts) => apiFetch(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts) => apiFetch(path, { ...opts, method: 'DELETE' }),
};
