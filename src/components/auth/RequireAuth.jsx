import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAdminRole } from '../../utils/roles';

const ROLE_RANK = { STUDENT: 0, TEACHER: 1, MARKETING: 2, SCHOOL_ADMIN: 3, ADMIN: 3, SUPER_ADMIN: 4 };

/**
 * RequireAuth — route guard.
 *
 *   <RequireAuth>            — any authenticated user (e.g. the personal panel).
 *   <RequireAuth adminOnly>  — admin/staff only. Authenticated non-admins
 *                              (chiefly students) are bounced to /panel rather
 *                              than shown an access-denied wall, so they always
 *                              land somewhere they belong.
 */
export default function RequireAuth({ children, minRole, adminOnly = false }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdminRole(user.role)) {
    return <Navigate to="/panel" replace />;
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
