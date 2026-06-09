/**
 * roles.js — single source of truth for "which area does this user belong to".
 *
 * The backend returns roles as lowercase strings. Admin/staff accounts
 * ('superadmin', 'admin', 'marketing', 'school_admin') belong in the admin
 * console at /admin. Everyone else who can authenticate — chiefly the
 * email-provisioned end users with role 'student' — belongs in the personal
 * panel at /panel.
 *
 * Comparison is case-insensitive so a backend that ever returns 'ADMIN' or
 * 'Student' still routes correctly.
 */

export const ADMIN_ROLES = ['superadmin', 'admin', 'marketing', 'school_admin'];

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(String(role ?? '').toLowerCase());
}

/** Default landing route for a freshly authenticated user, by role. */
export function homePathForRole(role) {
  return isAdminRole(role) ? '/admin' : '/panel';
}
