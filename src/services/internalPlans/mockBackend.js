/**
 * mockBackend.js
 *
 * localStorage-backed implementation of the Internal Plans API.
 * All public functions return { success, data, meta? } or throw an
 * object shaped like { success: false, error: { code, message } }.
 *
 * Swap to real HTTP: set USE_MOCK = false in internalPlansService.js
 * and replace the import of this file with your real apiClient calls.
 *
 * Storage keys:
 *   kommon.internalPlans.v1        — array of InternalPlan objects
 *   kommon.internalPlans.coupons.v1 — NOT used separately (coupons are
 *                                     embedded inside each plan's .coupons[])
 */

/* ─── Storage helpers ──────────────────────────────────────────────────── */

const PLANS_KEY   = 'kommon.internalPlans.v1';

function readPlans() {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writePlans(plans) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

/* ─── ID generation ─────────────────────────────────────────────────────── */

function nextId(plans) {
  if (!plans.length) return 1;
  return Math.max(...plans.map((p) => p.id)) + 1;
}

/**
 * Generate an opaque random reference ID for an internal plan.
 * This is the identifier forwarded to webhook subscribers — kept distinct
 * from the internal numeric `id` so external systems never see sequential
 * primary keys.
 */
function genRefId() {
  // Prefer the browser/Node WebCrypto UUID generator when available.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `iplan_${crypto.randomUUID()}`;
  }
  // Fallback for older runtimes — 16 hex chars of cryptographic randomness.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return `iplan_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/* ─── Seed data ─────────────────────────────────────────────────────────── */

const SEED_PLANS = [
  {
    id: 1,
    refId: 'iplan_seed_a3f2c9d18b7e4f01',
    name: 'Data Science — 6 Month Intensive',
    duration: '6_MONTHS',
    description: 'Comprehensive 6-month data science programme with placement support.',
    courseId: 1,
    status: 'ACTIVE',
    coupons: [
      {
        id: 1,
        code: 'WELCOME10',
        discountType: 'PERCENT',
        discountValue: 10,
        expiryDate: '2027-12-31',
        usageLimit: 100,
        usedCount: 5,
        status: 'ACTIVE',
      },
      {
        id: 2,
        code: 'FLAT500',
        discountType: 'FLAT',
        discountValue: 500,
        expiryDate: '2026-06-30',
        usageLimit: 50,
        usedCount: 50,
        status: 'ACTIVE',
      },
    ],
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: 2,
    refId: 'iplan_seed_5d8c7b6e2f094a13',
    name: 'Full Stack — 3 Month Bootcamp',
    duration: '3_MONTHS',
    description: 'Fast-track full-stack web development bootcamp.',
    courseId: 2,
    status: 'ACTIVE',
    coupons: [
      {
        id: 1,
        code: 'BOOT20',
        discountType: 'PERCENT',
        discountValue: 20,
        expiryDate: '2025-01-01', // expired on purpose for testing
        usageLimit: 200,
        usedCount: 10,
        status: 'ACTIVE',
      },
    ],
    createdAt: new Date('2026-02-01').toISOString(),
    updatedAt: new Date('2026-02-01').toISOString(),
  },
  {
    id: 3,
    refId: 'iplan_seed_91e0f8a4c3b25d67',
    name: 'AI/ML — 12 Month Master Program',
    duration: '12_MONTHS',
    description: 'Year-long AI/ML mastery programme with live projects.',
    courseId: 1,
    status: 'INACTIVE',
    coupons: [],
    createdAt: new Date('2026-03-01').toISOString(),
    updatedAt: new Date('2026-03-01').toISOString(),
  },
];

/**
 * Initialise storage with seed data if not already present.
 *
 * Also backfills `refId` on any pre-existing stored plans that were
 * created before this field was introduced, so the webhook payload is
 * never missing the reference ID.
 */
export function ensureSeeded() {
  const existing = readPlans();
  if (existing === null) {
    writePlans(SEED_PLANS);
    return;
  }
  let dirty = false;
  for (const plan of existing) {
    if (!plan.refId) {
      plan.refId = genRefId();
      dirty = true;
    }
  }
  if (dirty) writePlans(existing);
}

/* ─── Response builders ─────────────────────────────────────────────────── */

function ok(data, meta) {
  return meta !== undefined
    ? { success: true, data, meta }
    : { success: true, data };
}

function fail(code, message, status = 400) {
  const err = new Error(message);
  err.status  = status;
  err.code    = code;
  err.details = null;
  // Also carry the ApiError-shaped envelope for callers that read it
  err.envelope = { success: false, error: { code, message } };
  return err;
}

/* ─── Duration enum ─────────────────────────────────────────────────────── */

export const DURATIONS = ['1_MONTH', '3_MONTHS', '6_MONTHS', '12_MONTHS'];

/* ─── Plans CRUD ────────────────────────────────────────────────────────── */

/**
 * List plans with optional search/filter/pagination.
 *
 * @param {{ page?: number, limit?: number, search?: string, courseId?: number|string, status?: string }} params
 * @returns {{ success: true, data: Plan[], meta: PaginationMeta }}
 */
export function listPlans(params = {}) {
  ensureSeeded();
  const all = readPlans();

  const page   = Math.max(1, parseInt(params.page,  10) || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 10));
  const search = (params.search ?? '').trim().toLowerCase();
  const courseId = params.courseId != null ? Number(params.courseId) : null;
  const status   = params.status && params.status !== 'ALL' ? params.status : null;

  let filtered = all;
  if (search)   filtered = filtered.filter((p) => p.name.toLowerCase().includes(search));
  if (courseId) filtered = filtered.filter((p) => p.courseId === courseId);
  if (status)   filtered = filtered.filter((p) => p.status === status);

  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * limit;
  const data       = filtered.slice(start, start + limit);

  return ok(data, { page: safePage, limit, total, totalPages });
}

/**
 * Get a plan by ID.
 * @param {number} id
 */
export function getPlanById(id) {
  ensureSeeded();
  const plans = readPlans();
  const plan  = plans.find((p) => p.id === Number(id));
  if (!plan) throw fail('NOT_FOUND', `Internal plan ${id} not found`, 404);
  return ok(plan);
}

/**
 * Create a new plan.
 * @param {object} body
 */
export function createPlan(body) {
  ensureSeeded();
  const plans = readPlans();

  // Validation
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 200) {
    throw fail('VALIDATION_ERROR', 'name must be 2–200 characters');
  }
  if (!DURATIONS.includes(body.duration)) {
    throw fail('VALIDATION_ERROR', `duration must be one of: ${DURATIONS.join(', ')}`);
  }
  if (!body.courseId) {
    throw fail('VALIDATION_ERROR', 'courseId is required');
  }
  if (body.description && body.description.length > 2000) {
    throw fail('VALIDATION_ERROR', 'description must be at most 2000 characters');
  }

  const now  = new Date().toISOString();
  const plan = {
    id:          nextId(plans),
    refId:       genRefId(),
    name:        body.name.trim(),
    duration:    body.duration,
    description: body.description?.trim() ?? null,
    courseId:    Number(body.courseId),
    coupons:     Array.isArray(body.coupons) ? body.coupons : [],
    status:      body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    createdAt:   now,
    updatedAt:   now,
  };

  plans.push(plan);
  writePlans(plans);
  return ok(plan);
}

/**
 * Update a plan's fields (partial update).
 * @param {number} id
 * @param {object} body
 */
export function updatePlan(id, body) {
  ensureSeeded();
  const plans = readPlans();
  const idx   = plans.findIndex((p) => p.id === Number(id));
  if (idx === -1) throw fail('NOT_FOUND', `Internal plan ${id} not found`, 404);

  const plan = plans[idx];

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 200) {
      throw fail('VALIDATION_ERROR', 'name must be 2–200 characters');
    }
    plan.name = body.name.trim();
  }
  if (body.duration !== undefined) {
    if (!DURATIONS.includes(body.duration)) {
      throw fail('VALIDATION_ERROR', `duration must be one of: ${DURATIONS.join(', ')}`);
    }
    plan.duration = body.duration;
  }
  if (body.description !== undefined) {
    if (body.description && body.description.length > 2000) {
      throw fail('VALIDATION_ERROR', 'description must be at most 2000 characters');
    }
    plan.description = body.description?.trim() ?? null;
  }
  if (body.courseId !== undefined) {
    plan.courseId = Number(body.courseId);
  }
  if (body.status !== undefined) {
    plan.status = body.status;
  }
  if (Array.isArray(body.coupons)) {
    plan.coupons = body.coupons;
  }
  plan.updatedAt = new Date().toISOString();

  plans[idx] = plan;
  writePlans(plans);
  return ok(plan);
}

/**
 * Set plan status.
 * @param {number} id
 * @param {'ACTIVE'|'INACTIVE'} status
 */
export function setPlanStatus(id, status) {
  return updatePlan(id, { status });
}

/**
 * Delete a plan.
 * @param {number} id
 */
export function removePlan(id) {
  ensureSeeded();
  const plans = readPlans();
  const idx   = plans.findIndex((p) => p.id === Number(id));
  if (idx === -1) throw fail('NOT_FOUND', `Internal plan ${id} not found`, 404);
  plans.splice(idx, 1);
  writePlans(plans);
  return ok(null);
}

/**
 * List plans for a specific course (no pagination — used for dropdowns).
 * @param {number} courseId
 */
export function listByCourse(courseId) {
  ensureSeeded();
  const plans = readPlans();
  const data  = plans.filter((p) => p.courseId === Number(courseId) && p.status === 'ACTIVE');
  return ok(data);
}

/* ─── Coupon validation ─────────────────────────────────────────────────── */

/**
 * Validate a coupon for an internal plan.
 * Returns { valid, discountAmount, finalAmount, reason? }
 *
 * Price is sourced from the linked course (passed in as `basePrice`),
 * since InternalPlan no longer carries its own price.
 *
 * @param {{ code: string, internalPlanId: number, basePrice: number }} params
 */
export function validateCoupon({ code, internalPlanId, basePrice }) {
  ensureSeeded();
  const plans = readPlans();
  const plan  = plans.find((p) => p.id === Number(internalPlanId));

  if (!plan) {
    return { valid: false, discountAmount: 0, finalAmount: 0, reason: 'Plan not found' };
  }

  const price = Number(basePrice);
  if (!isFinite(price) || price <= 0) {
    return { valid: false, discountAmount: 0, finalAmount: 0, reason: 'Course price not available' };
  }

  const coupon = (plan.coupons ?? []).find(
    (c) => c.code.toUpperCase() === String(code).toUpperCase().trim(),
  );

  if (!coupon) {
    return { valid: false, discountAmount: 0, finalAmount: price, reason: 'Coupon not found' };
  }

  if (coupon.status !== 'ACTIVE') {
    return { valid: false, discountAmount: 0, finalAmount: price, reason: 'Coupon is inactive' };
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    return { valid: false, discountAmount: 0, finalAmount: price, reason: 'Coupon has expired' };
  }

  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discountAmount: 0, finalAmount: price, reason: 'Coupon usage limit reached' };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'PERCENT') {
    discountAmount = Math.round((price * coupon.discountValue) / 100 * 100) / 100;
  } else {
    // FLAT
    discountAmount = Math.min(coupon.discountValue, price);
  }

  const finalAmount = Math.max(0, price - discountAmount);

  return { valid: true, discountAmount, finalAmount, coupon };
}

/* ─── Fee calculation ───────────────────────────────────────────────────── */

/**
 * Calculate fee breakdown for an internal plan with optional coupon.
 *
 * `basePrice` is supplied by the caller (the linked course's `courseFee`),
 * since InternalPlan no longer stores its own price.
 *
 * @param {{ internalPlanId: number, basePrice: number, couponCode?: string }} params
 * @returns {{ basePrice, discount, finalAmount, breakdown }}
 */
export function calculateFee({ internalPlanId, basePrice, couponCode }) {
  ensureSeeded();
  const plans = readPlans();
  const plan  = plans.find((p) => p.id === Number(internalPlanId));

  if (!plan) {
    throw fail('NOT_FOUND', `Internal plan ${internalPlanId} not found`, 404);
  }

  const price = Number(basePrice);
  if (!isFinite(price) || price <= 0) {
    throw fail('VALIDATION_ERROR', 'basePrice (course fee) is required and must be a positive number');
  }

  if (!couponCode) {
    return ok({
      basePrice: price,
      discount:    0,
      finalAmount: price,
      breakdown: [
        { label: 'Base Price', amount: price },
        { label: 'Discount',   amount: 0 },
        { label: 'Total',      amount: price },
      ],
    });
  }

  const result = validateCoupon({ code: couponCode, internalPlanId, basePrice: price });

  if (!result.valid) {
    return ok({
      basePrice: price,
      discount:    0,
      finalAmount: price,
      couponValid: false,
      couponReason: result.reason,
      breakdown: [
        { label: 'Base Price', amount: price },
        { label: 'Discount',   amount: 0 },
        { label: 'Total',      amount: price },
      ],
    });
  }

  return ok({
    basePrice: price,
    discount:    result.discountAmount,
    finalAmount: result.finalAmount,
    couponValid: true,
    breakdown: [
      { label: 'Base Price', amount: price },
      { label: `Coupon (${couponCode.toUpperCase()})`, amount: -result.discountAmount },
      { label: 'Total',      amount: result.finalAmount },
    ],
  });
}
