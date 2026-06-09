import { api } from './apiClient';

/**
 * userPanelService — data layer for the logged-in user's OWN panel.
 *
 * Backed by GET /api/v1/auth/me/account, which is strictly scoped to the
 * caller's access token on the server. The endpoint resolves the user from
 * their token, then returns only the Sumago mirror row matching that user's
 * email — so a user can only ever see their own profile and transactions.
 *
 * Response shape (after apiClient strips the { success, data } envelope):
 *   {
 *     profile: {
 *       email, role, memberSince,
 *       firstName, lastName, phoneNumber,
 *       plan, group, unit, phase, segment,
 *       emailStatus, onboardingStatus
 *     },
 *     transactions: [   // planHistory, newest first
 *       { paymentDate, amount, plan, transactionId }
 *     ]
 *   }
 */
export const userPanelService = {
  /** The logged-in user's own profile + transaction history. */
  getAccount: () => api.get('/auth/me/account'),
};
