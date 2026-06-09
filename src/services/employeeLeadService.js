/**
 * employeeLeadService
 * -------------------
 * Frontend wrapper around the `/api/v1/employee/leads/*` backend routes.
 * Kept separate from `followupService` and `adminService` because the
 * employee portal's data model is leads-first (the followup row is a
 * lazily-created implementation detail) — sharing a service module would
 * leak admin-flow concepts into the employee UI.
 *
 * Endpoints wrapped:
 *   GET    /employee/leads                              -> list my leads (paginated, filterable)
 *   GET    /employee/leads/:enrollmentId                -> single lead + followup + notes timeline
 *   POST   /employee/leads/:enrollmentId/notes          -> append a note (auto-creates the followup)
 *   PATCH  /employee/leads/:enrollmentId/status         -> set status and/or schedule next followup
 */
import { api } from './apiClient';

export const employeeLeadService = {
  /**
   * @param {{
   *   page?: number, limit?: number, search?: string,
   *   status?: string, followupStatus?: string,
   * }} [params]
   */
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page)            qs.set('page',  String(params.page));
    if (params.limit)           qs.set('limit', String(params.limit));
    if (params.search)          qs.set('search', String(params.search));
    if (params.status)          qs.set('status', String(params.status));
    if (params.followupStatus)  qs.set('followupStatus', String(params.followupStatus));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return api.get(`/employee/leads${suffix}`);
  },

  /**
   * Fetch full detail for one lead. Returns `{ enrollment, followup }`
   * where `followup` may be null if the lead has never been touched.
   * @param {string} enrollmentId
   */
  detail: (enrollmentId) =>
    api.get(`/employee/leads/${enrollmentId}`),

  /**
   * Add a note to a lead. Creates the underlying followup record on the
   * caller's first action (no separate "start working" step needed).
   * @param {string} enrollmentId
   * @param {{ body: string, metadata?: object }} payload
   */
  addNote: (enrollmentId, payload) =>
    api.post(`/employee/leads/${enrollmentId}/notes`, payload),

  /**
   * Update status and/or schedule the next follow-up. Either field may be
   * sent alone — backend requires at least one.
   * @param {string} enrollmentId
   * @param {{ status?: string, nextFollowupDate?: string|null }} payload
   */
  updateStatus: (enrollmentId, payload) =>
    api.patch(`/employee/leads/${enrollmentId}/status`, payload),
};
