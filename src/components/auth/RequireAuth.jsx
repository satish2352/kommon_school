import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ROLE_RANK = { STUDENT: 0, TEACHER: 1, MARKETING: 2, SCHOOL_ADMIN: 3, ADMIN: 3, SUPER_ADMIN: 4 };

export default function RequireAuth({ children, minRole }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
