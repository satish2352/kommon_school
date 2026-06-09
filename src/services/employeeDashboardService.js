/**
 * employeeDashboardService
 * ------------------------
 * Wrapper for GET /api/v1/employee/dashboard. Returns the shape:
 *
 *   {
 *     metrics: {
 *       totalAssigned, newLeads, todaysFollowups, overdueFollowups,
 *       upcomingFollowups, interested, paymentPending, paymentCompleted,
 *       converted, notInterested, lost, closed, conversionRate,
 *       byFollowupStatus: { <status>: number, ... },
 *     },
 *     recentActivity: [{ id, kind, body, leadName, leadEmail, enrollmentId, createdAt, isSystem }],
 *   }
 *
 * The endpoint is hard-bound to req.user.id server-side, so there is
 * nothing for the client to scope — fetch and render.
 */
import { api } from './apiClient';

export const employeeDashboardService = {
  get: () => api.get('/employee/dashboard'),
};
