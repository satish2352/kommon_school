/**
 * panelService.js
 *
 * Authenticated self-service calls for the logged-in student panel.
 */

import { api } from './apiClient';

export const panelService = {
  /**
   * Start a new plan purchase for the logged-in student. Backend creates (or
   * reuses) a fresh enrollment for their own email, identity auto-filled from
   * their last enrollment. Returns { id, enrollmentId, name, email, phone }.
   */
  startPurchase: () => api.post('/enrollments/me'),
};
