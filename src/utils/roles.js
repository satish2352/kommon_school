/**
 * roles.js — single source of truth for "which area does this user belong to".
 *
 * The backend returns roles as lowercase strings. Each user belongs to
 * exactly one of three areas of the app:
 *
 *   superadmin / admin / marketing / school_admin  →  /admin   (admin console)
 *   employee                                       →  /employee (follow-up portal)
 *   anything else (chiefly 'student')              →  /panel   (personal panel)
 *
 * Comparison is case-insensitive so a backend that ever returns 'ADMIN' or
 * 'Student' still routes correctly.
 */

export const ADMIN_ROLES    = ['superadmin', 'admin', 'marketing', 'school_admin'];
// Employee Follow-Up Portal — strictly scoped role. NOT included in
// ADMIN_ROLES so isAdminRole() stays a sharp boundary; an employee
// hitting /admin gets bounced to /employee, not given admin access.
export const EMPLOYEE_ROLES = ['employee'];

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(String(role ?? '').toLowerCase());
}

export function isEmployeeRole(role) {
  return EMPLOYEE_ROLES.includes(String(role ?? '').toLowerCase());
}

/** Default landing route for a freshly authenticated user, by role. */
export function homePathForRole(role) {
  if (isAdminRole(role))    return '/admin';
  if (isEmployeeRole(role)) return '/employee';
  return '/panel';
}
