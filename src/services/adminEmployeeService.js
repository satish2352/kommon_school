/**
 * adminEmployeeService
 * --------------------
 * Thin frontend wrapper around the backend's Employee Follow-Up Portal
 * admin endpoints (Phase 2). Distinct from `usersAdminService` because the
 * employee dropdown wants a minimal projection and a different permission
 * gate (LEADS_ASSIGN vs USERS_MANAGE) — keeping it separate avoids cross-
 * coupling the existing user-management page with the new lead-assignment
 * flow.
 *
 * Endpoints wrapped:
 *   GET    /admin/employees                      -> list active employees
 *   PATCH  /admin/enrollments/:id/assign         -> single assign/unassign
 *   POST   /admin/enrollments/bulk-assign        -> bulk assign
 */
import { api } from './apiClient';

export const adminEmployeeService = {
  /**
   * List employees suitable for assignment dropdowns.
   *
   * Returns `{ rows: [{ id, email, role, deleted_at, created_at }], total }`.
   * Default `activeOnly: true` hides soft-deleted accounts.
   *
   * @param {{ activeOnly?: boolean, search?: string, limit?: number }} [params]
   */
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.activeOnly === false) qs.set('activeOnly', 'false');
    if (params.search)               qs.set('search', String(params.search));
    if (params.limit)                qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return api.get(`/admin/employees${suffix}`);
  },

  /**
   * Assign or unassign a single enrollment.
   * Pass `employeeId: null` to clear the assignment.
   *
   * @param {string}              enrollmentId
   * @param {string|null}         employeeId
   * @param {{ reason?: string }} [opts]
   */
  assignEnrollment: (enrollmentId, employeeId, opts = {}) =>
    api.patch(`/admin/enrollments/${enrollmentId}/assign`, {
      employeeId,
      ...(opts.reason ? { reason: opts.reason } : {}),
    }),

  /**
   * Bulk-assign N enrollments to one employee in a single request.
   * Returns `{ succeeded, failed, results: [{ id, ok, error? }] }`.
   *
   * @param {string[]}            enrollmentIds  (1..500)
   * @param {string|null}         employeeId
   * @param {{ reason?: string }} [opts]
   */
  bulkAssign: (enrollmentIds, employeeId, opts = {}) =>
    api.post('/admin/enrollments/bulk-assign', {
      enrollmentIds,
      employeeId,
      ...(opts.reason ? { reason: opts.reason } : {}),
    }),

  // ──────────────────────────────────────────────────────────────────
  // Employee account CRUD (Phase 3D — admin management page).
  // These wrap `/admin/users` filtered to role=employee. Distinct from
  // `list()` above because they return the full paginated payload (with
  // soft-deleted rows) and require USERS_MANAGE on the backend, whereas
  // `list()` is the LEADS_ASSIGN-gated dropdown projection.
  // ──────────────────────────────────────────────────────────────────

  /**
   * Paginated list of employee accounts (full payload with status).
   *
   * @param {{ page?, limit?, search?, status?: 'active'|'deleted' }} [params]
   */
  listFull: (params = {}) => {
    const qs = new URLSearchParams();
    qs.set('role', 'employee');
    if (params.page)   qs.set('page',  String(params.page));
    if (params.limit)  qs.set('limit', String(params.limit));
    if (params.search) qs.set('search', String(params.search));
    if (params.status) qs.set('status', String(params.status));
    return api.get(`/admin/users?${qs.toString()}`);
  },

  /**
   * Create a new employee user.
   * The backend rejects this for the caller's own email + dup-checks too.
   * @param {{ email: string, password: string }} payload
   */
  create: ({ email, password }) =>
    api.post('/admin/users', { email, password, role: 'employee' }),

  /**
   * Update an employee. Use `{ role: 'employee' }` to keep role pinned
   * (the validator allows admin/marketing/superadmin too, so we set it
   * explicitly here so an admin can't accidentally promote via this UI).
   * @param {string} userId
   * @param {{ role?, password? }} patch
   */
  update: (userId, patch) =>
    api.patch(`/admin/users/${userId}`, patch),

  /**
   * Admin-driven password reset. Sets the user's password without
   * needing the current value. Same endpoint as update, separated as
   * its own method so the calling code reads cleanly.
   */
  resetPassword: (userId, newPassword) =>
    api.patch(`/admin/users/${userId}`, { password: newPassword }),

  /** Soft-delete (deactivate) an employee account. */
  deactivate: (userId) =>
    api.delete(`/admin/users/${userId}`),

  /** Re-activate a previously soft-deleted account. Idempotent. */
  reactivate: (userId) =>
    api.post(`/admin/users/${userId}/reactivate`),
};
