import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/enrollments', label: 'Enrollments' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/follow-ups', label: 'Follow-ups' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="text-lg font-bold text-blue-600">Kommon</div>
          <div className="text-xs text-gray-500">Admin console</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100 space-y-2">
          <div className="px-3 text-xs">
            <div className="text-gray-900 font-medium truncate">{user?.email}</div>
            <div className="text-gray-500">{user?.role}</div>
          </div>
          <button
            onClick={onLogout}
            className="w-full px-3 py-2 text-sm text-left rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto">
        <div className="px-8 py-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
