import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAdminRole, isEmployeeRole, homePathForRole } from '../../utils/roles';

const ROLE_RANK = { STUDENT: 0, TEACHER: 1, MARKETING: 2, SCHOOL_ADMIN: 3, ADMIN: 3, SUPER_ADMIN: 4 };

/**
 * RequireAuth — route guard.
 *
 *   <RequireAuth>                — any authenticated user (e.g. /panel).
 *   <RequireAuth adminOnly>      — admin/staff only.
 *   <RequireAuth employeeOnly>   — follow-up employee only.
 *
 * Mismatched roles are bounced to *their own* home area via
 * homePathForRole(user.role), not blindly to /panel. This is important
 * for the Employee Portal — an admin landing on /employee should be
 * redirected to /admin, and vice versa.
 */
export default function RequireAuth({
  children,
  minRole,
  adminOnly    = false,
  employeeOnly = false,
}) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdminRole(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  if (employeeOnly && !isEmployeeRole(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  if (minRole && ROLE_RANK[user.role] < (ROLE_RANK[minRole] ?? 99)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access denied</h1>
          <p className="text-gray-600">Your role ({user.role}) cannot view this page.</p>
        </div>
      </div>
    );
  }

  return children;
}
