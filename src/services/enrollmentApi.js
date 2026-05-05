/**
 * enrollmentApi.js
 *
 * Thin HTTP client for the enrollment + payment flow.
 * All mutating requests include an Idempotency-Key header (UUID v4) so
 * the backend can safely replay them on network retries without double-charging.
 *
 * Base URL is read from VITE_API_BASE_URL at build time.
 * Default: http://localhost:3000/api/v1
 */

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/**
 * Generate a UUID v4 for idempotency keys.
 * Prefers crypto.randomUUID() but falls back to getRandomValues() because
 * randomUUID is gated on a "secure context" — i.e. it's undefined when
 * the page is served over plain HTTP from anything other than localhost.
 */
function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40; // v4
    b[8] = (b[8] & 0x3f) | 0x80; // variant 10
    const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  // Last-resort non-cryptographic fallback (very old browsers).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Shared fetch wrapper.
 * Throws a structured error object on non-2xx responses so callers
 * can distinguish network failures from API-level failures.
 *
 * @param {string} path - API path relative to BASE_URL (e.g. '/enrollments')
 * @param {RequestInit} options - fetch options
 * @param {string} [idempotencyKey] - optional pre-generated key; one is created if omitted
 * @returns {Promise<unknown>}
 */
async function apiFetch(path, options = {}, idempotencyKey) {
  const key = idempotencyKey ?? generateIdempotencyKey();

  const headers = {
    'Content-Type': 'application/json',
    'Idempotency-Key': key,
    ...(options.headers ?? {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30 s client timeout

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw Object.assign(new Error('Request timed out'), { code: 'TIMEOUT' });
    }
    throw err;
  }
  clearTimeout(timeoutId);

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (json && json.error && json.error.message) ||
      `API error ${response.status}`;
    const err = Object.assign(new Error(message), {
      status: response.status,
      code: json?.error?.code ?? 'API_ERROR',
      details: json?.error?.details ?? null,
    });
    throw err;
  }

  return json;
}

/**
 * Create a new enrollment (lead capture).
 * The backend is idempotent on the same key — safe to retry.
 *
 * @param {{ name: string, phone: string, email: string, role: string,
 *            education?: string, readiness?: string, source?: string,
 *            tenantId?: string }} data
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function createEnrollment(data) {
  const idempotencyKey = generateIdempotencyKey();
  return apiFetch(
    '/enrollments',
    {
      method: 'POST',
      body: JSON.stringify({ ...data, idempotencyKey }),
    },
    idempotencyKey,
  );
}

/**
 * Create a Razorpay payment order on the public marketing flow.
 * Amount + currency come from the backend env, so the client doesn't need to know pricing.
 *
 * @param {string} enrollmentId - internal CUID returned from createEnrollment
 * @returns {Promise<{ success: boolean, data: { paymentId: string, razorpayOrderId: string,
 *            amount: number, currency: string, keyId: string, enrollmentId: string } }>}
 */
export async function createPublicPaymentOrder(enrollmentId) {
  return apiFetch(`/enrollments/${enrollmentId}/payment-order`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Confirm a Razorpay payment from the public marketing flow.
 *
 * @param {string} enrollmentId - internal CUID
 * @param {{ paymentId: string, razorpayOrderId: string, razorpayPaymentId: string,
 *            razorpaySignature: string }} payload - returned by Razorpay checkout
 */
export async function verifyPublicPayment(enrollmentId, payload) {
  return apiFetch(`/enrollments/${enrollmentId}/payment-verify`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Create a Razorpay payment order for an existing enrollment.
 * Must be called after the user is authenticated.
 *
 * @param {string} enrollmentId - internal CUID of the enrollment
 * @param {{ amount: number, currency?: string, baseAmount?: number,
 *            taxAmount?: number, discount?: number }} orderParams
 * @returns {Promise<{ success: boolean, data: { payment: object, razorpayOrder: object } }>}
 */
export async function createPaymentOrder(enrollmentId, orderParams = {}) {
  const idempotencyKey = generateIdempotencyKey();
  return apiFetch(
    '/payments/orders',
    {
      method: 'POST',
      body: JSON.stringify({
        enrollmentId,
        idempotencyKey,
        ...orderParams,
      }),
    },
    idempotencyKey,
  );
}

/**
 * Verify a Razorpay payment signature after the client-side checkout completes.
 * The backend marks the payment IN_PROGRESS; the webhook finalises to SUCCESS.
 *
 * @param {{ paymentId: string, razorpayOrderId: string,
 *            razorpayPaymentId: string, razorpaySignature: string }} payload
 * @returns {Promise<{ success: boolean, data: { status: string } }>}
 */
export async function verifyPayment(payload) {
  return apiFetch('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Poll the payment status for a given internal payment ID.
 *
 * @param {string} paymentId - internal CUID from createPaymentOrder response
 * @returns {Promise<{ success: boolean, data: { status: string, paidAmount: number } }>}
 */
export async function getPaymentStatus(paymentId) {
  return apiFetch(`/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
  });
}
