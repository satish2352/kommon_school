import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

/* ── Icon set ─────────────────────────────────────────────
 * Inline SVGs, line style, stroke-width 1.75, 18px box.
 * Matches the visual weight of shadcn-ui / lucide icons used
 * by the Eleganza reference sidebar.
 */
const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const Icon = {
  dashboard: (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  users: (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  userPlus: (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  ),
  upload: (
    <svg {...iconProps}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  ),
  card: (
    <svg {...iconProps}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h2M11 15h3" />
    </svg>
  ),
  phone: (
    <svg {...iconProps}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  webhook: (
    <svg {...iconProps}>
      <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" />
      <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1A4 4 0 1 1 15.66 9" />
      <path d="m12 7 3.13 5.73C15.66 13.7 16.9 14 18 14a4 4 0 1 1-4 4" />
    </svg>
  ),
  mail: (
    <svg {...iconProps}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  layers: (
    <svg {...iconProps}>
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  ),
  fileText: (
    <svg {...iconProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  ),
  plus: (
    <svg {...iconProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  book: (
    <svg {...iconProps}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  clock: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  key: (
    <svg {...iconProps}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.7 12.3 6.3-6.3M16 6l2.5 2.5M14 8l2.5 2.5" />
    </svg>
  ),
  logout: (
    <svg {...iconProps}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  ),
  close: (
    <svg {...iconProps}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
};

/* ── Nav model ────────────────────────────────────────────
 * Flat groups, each item is a direct route. No collapsible
 * carets — mirrors the reference's `SidebarGroup` +
 * `SidebarGroupLabel` + `SidebarMenu` pattern.
 *
 * Every existing route is preserved exactly.
 */
const NAV_SECTIONS = [
  {
    items: [
      { to: '/admin', end: true, label: 'Dashboard', icon: Icon.dashboard },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/enrollments', end: true, label: 'Enrollments', icon: Icon.users },
      // Dedicated financial-breakdown view for admin-internal enrollments.
      // Sits alongside the all-enrollments page so the simpler list stays
      // simple and admins can deep-dive on internal-flow pricing here.
      { to: '/admin/internal-enrollments', label: 'Internal Enrollments', icon: Icon.fileText },
      { to: '/admin/payments', label: 'Payments', icon: Icon.card },
      { to: '/admin/follow-ups', label: 'Follow-ups', icon: Icon.phone },
      // Follow-Up team management — onboard / deactivate / reset password
      // for employees who log into the separate /employee portal.
      { to: '/admin/employees', label: 'Employees', icon: Icon.userPlus },
      // Email Log hidden from the admin nav (per request). Route still exists in
      // AppRoutes; uncomment to restore the menu item.
      // { to: '/admin/email-logs', label: 'Email Log', icon: Icon.mail },
    ],
  },
  {
    label: 'Sumago Integration',
    items: [
      { to: '/admin/webhooks',     label: 'Provision User (POST)', icon: Icon.webhook },
      { to: '/admin/sumago-users', label: 'Fetch Users (GET)',     icon: Icon.users },
    ],
  },
  {
    label: 'Plans',
    subgroups: [
      {
        label: 'Internal',
        items: [
          { to: '/admin/course-names', label: 'Course Names', icon: Icon.book },
          { to: '/admin/duration-master', label: 'Duration Master', icon: Icon.clock },
          { to: '/admin/courses', label: 'Courses', icon: Icon.book },
          { to: '/admin/internal-plans', end: true, label: 'Internal Plans', icon: Icon.fileText },
          { to: '/admin/enrollments/new', label: 'New Enrollment', icon: Icon.userPlus },
          { to: '/admin/enrollments/bulk', label: 'Bulk Upload (CSV)', icon: Icon.upload },
        ],
      },
      {
        label: 'External Plan',
        items: [
          { to: '/admin/plans', label: 'Plans', icon: Icon.layers },
        ],
      },
    ],
  },
];

/* Superadmin-only sections, appended after the base nav. */
const SUPERADMIN_NAV_SECTIONS = [
  {
    label: 'Settings',
    items: [
      { to: '/admin/razorpay-configs', label: 'Razorpay Keys', icon: Icon.key },
    ],
  },
];

/* ── Group heading (uppercase, low-opacity) ─────────────── */
function GroupLabel({ children }) {
  return (
    <div className="px-3 pt-4 pb-1.5 first:pt-1">
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: 'var(--admin-sidebar-fg-muted)' }}
      >
        {children}
      </span>
    </div>
  );
}

/* ── Subgroup heading — slightly indented, smaller ──────── */
function SubGroupLabel({ children }) {
  return (
    <div className="px-4 pt-2.5 pb-1">
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: 'var(--admin-sidebar-fg-muted)' }}
      >
        {children}
      </span>
    </div>
  );
}

/* ── Single nav item ────────────────────────────────────── */
function NavItem({ item, onLinkClick }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onLinkClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 admin-nav-item ${
          isActive ? 'admin-nav-active' : ''
        }`
      }
    >
      <span className="shrink-0">{item.icon}</span>
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

/* ── Sidebar content (shared desktop + mobile) ─────────── */
function SidebarContent({ onLinkClick, user, onLogout }) {
  const initial = (user?.email?.[0] ?? 'A').toUpperCase();
  const role = user?.role ?? 'Admin';
  const isSuperAdmin = String(user?.role ?? '').toLowerCase() === 'superadmin';
  const navSections = isSuperAdmin
    ? [...NAV_SECTIONS, ...SUPERADMIN_NAV_SECTIONS]
    : NAV_SECTIONS;
  return (
    <div className="flex flex-col h-full">
      {/* Brand — clean wordmark, mint accent, matches reference */}
      <div className="px-5 h-[60px] flex items-center shrink-0">
        <div className="flex items-baseline gap-0.5 leading-none">
          <span
            className="text-[17px] font-bold tracking-tight"
            style={{ color: 'var(--admin-sidebar-mint)' }}
          >
            Kommon
          </span>
          <span
            className="text-[13px] font-semibold tracking-tight"
            style={{ color: 'var(--admin-text)' }}
          >
            School
          </span>
        </div>
      </div>

      {/* Divider under brand */}
      <div className="h-px shrink-0" style={{ background: 'var(--admin-sidebar-border)' }} />

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={section.label ?? `section-${idx}`}>
            {section.label && <GroupLabel>{section.label}</GroupLabel>}

            {/* Flat items (legacy sections without subgroups) */}
            {section.items && (
              <div className="space-y-0.5 px-1">
                {section.items.map((item) => (
                  <NavItem key={item.to} item={item} onLinkClick={onLinkClick} />
                ))}
              </div>
            )}

            {/* Nested subgroups */}
            {section.subgroups && section.subgroups.map((sub) => (
              <div key={sub.label}>
                <SubGroupLabel>{sub.label}</SubGroupLabel>
                <div className="space-y-0.5 px-1">
                  {sub.items.map((item) => (
                    <NavItem key={item.to} item={item} onLinkClick={onLinkClick} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer — divider + user row + sign-out */}
      <div className="h-px shrink-0" style={{ background: 'var(--admin-sidebar-border)' }} />
      <div className="px-3 py-3 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[12px] font-semibold"
            style={{
              background: 'var(--admin-accent-soft)',
              border: '1px solid var(--admin-sidebar-border)',
              color: 'var(--admin-sidebar-mint)',
            }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="text-[12.5px] font-semibold truncate leading-tight"
              style={{ color: 'var(--admin-text)' }}
            >
              {user?.email ?? 'admin@kommon'}
            </div>
            <div
              className="text-[10.5px] uppercase tracking-[0.08em] mt-0.5 leading-tight"
              style={{ color: 'var(--admin-sidebar-fg-muted)' }}
            >
              {role}
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="shrink-0 p-1.5 rounded-md admin-nav-item"
            title="Sign out"
            aria-label="Sign out"
          >
            {Icon.logout}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-shell h-screen flex overflow-hidden" style={{ background: 'var(--admin-bg)' }}>

      {/* ── Desktop permanent sidebar ─── */}
      <aside
        className="hidden md:flex md:w-[240px] lg:w-[256px] shrink-0 flex-col"
        style={{
          background: 'var(--admin-sidebar)',
          borderRight: '1px solid var(--admin-sidebar-border)',
        }}
      >
        <SidebarContent user={user} onLogout={onLogout} onLinkClick={undefined} />
      </aside>

      {/* ── Mobile drawer backdrop ─── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/70 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile slide-in drawer ─── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--admin-sidebar)' }}
        aria-label="Mobile navigation"
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg admin-nav-item"
          aria-label="Close navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <SidebarContent
          user={user}
          onLogout={onLogout}
          onLinkClick={() => setDrawerOpen(false)}
        />
      </div>

      {/* ── Main content column ─── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Desktop top header bar — glass with subtle border */}
        <header
          className="hidden md:flex items-center justify-between px-6 h-14 shrink-0"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'saturate(180%) blur(14px)',
            WebkitBackdropFilter: 'saturate(180%) blur(14px)',
            borderBottom: '1px solid var(--admin-border)',
          }}
        >
          {/* Left: page breadcrumb derived from route */}
          <div className="flex items-center gap-2 text-[13px]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--admin-accent)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-700">
              {location.pathname === '/admin' ? 'Dashboard' : location.pathname.replace('/admin/', '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          </div>

          {/* Right: bell + user */}
          <div className="flex items-center gap-2.5">
            {/* Bell */}
            <button
              type="button"
              className="relative p-2 rounded-md text-slate-500 hover:text-brand-700 hover:bg-slate-100 transition-all duration-150"
              title="Notifications"
              aria-label="Notifications"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
            </button>

            {/* User chip */}
            <div className="flex items-center gap-2.5 pl-3 ml-1" style={{ borderLeft: '1px solid var(--admin-border)' }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
              >
                <span className="text-white text-xs font-bold">
                  {user?.email?.[0]?.toUpperCase() ?? 'A'}
                </span>
              </div>
              <div className="hidden lg:block leading-tight">
                <div className="text-[13px] font-semibold text-slate-800">{user?.email?.split('@')[0]}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile top bar */}
        <header
          className="md:hidden flex items-center justify-between px-4 h-14 shrink-0"
          style={{ background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid var(--admin-border)' }}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-md text-slate-500 hover:text-brand-700 hover:bg-slate-100 transition-colors duration-150"
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
            >
              <span className="text-white text-xs font-bold leading-none">K</span>
            </div>
            <span className="text-base font-semibold text-slate-900 tracking-tight">Kommon</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
            aria-label="Sign out"
            title={`Sign out (${user?.email ?? ''})`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </header>

        {/* Page scroll container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 py-6 md:px-6 md:py-8 lg:px-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#111827',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          success: {
            iconTheme: { primary: '#2563EB', secondary: '#fff' },
          },
        }}
      />
    </div>
  );
}
