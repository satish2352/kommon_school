import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

/* ──────────────────────────────────────────────────────────────────────────
 * EmployeeLayout
 * --------------
 * Shell for the /employee Follow-Up Portal. Visually mirrors AdminLayout
 * (same sidebar+topbar+main pattern, same admin-* CSS tokens) so the look
 * is consistent across portals, but the nav set is purposely small —
 * employees only manage their assigned leads, nothing else.
 *
 * Keeping a separate layout (instead of conditionally rendering inside
 * AdminLayout) means future employee-only UI affordances — performance
 * widgets, presence indicator, "I'm available" toggle — can land here
 * without polluting the admin sidebar.
 * ────────────────────────────────────────────────────────────────────── */

const iconProps = {
  width: 18, height: 18, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round',
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
  leads: (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  phone: (
    <svg {...iconProps}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  user: (
    <svg {...iconProps}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  logout: (
    <svg {...iconProps}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  ),
  bell: (
    <svg {...iconProps}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

/* ── Sidebar nav model ─────────────────────────────────────────────────
 * Sparse on purpose — employee = "view + work my leads". Anything that
 * looks like admin (assignment, configuration, reports, user management)
 * stays in the admin portal. Order reflects daily-use frequency.
 * ──────────────────────────────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    items: [
      { to: '/employee', end: true, label: 'Dashboard', icon: Icon.dashboard },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '/employee/leads',   label: 'My Leads',   icon: Icon.leads },
      // "Today" / "Overdue" are dashboard quick-filters, not separate routes,
      // so they don't appear here as nav items. Phase 3C dashboard adds them.
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/employee/profile', label: 'Profile', icon: Icon.user },
    ],
  },
];

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

function SidebarContent({ onLinkClick, user, onLogout }) {
  const initial = (user?.email?.[0] ?? 'E').toUpperCase();
  return (
    <div className="flex flex-col h-full">
      {/* Brand row — same wordmark as admin, but with a portal-specific
          subtitle so users can tell at a glance which app they're in. */}
      <div className="px-5 h-[60px] flex items-center shrink-0">
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-0.5">
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
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.12em] mt-1"
            style={{ color: 'var(--admin-sidebar-fg-muted)' }}
          >
            Follow-Up Portal
          </span>
        </div>
      </div>

      <div className="h-px shrink-0" style={{ background: 'var(--admin-sidebar-border)' }} />

      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={section.label ?? `section-${idx}`}>
            {section.label && <GroupLabel>{section.label}</GroupLabel>}
            <div className="space-y-0.5 px-1">
              {section.items.map((item) => (
                <NavItem key={item.to} item={item} onLinkClick={onLinkClick} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="h-px shrink-0" style={{ background: 'var(--admin-sidebar-border)' }} />
      <div className="px-3 py-3 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[12px] font-semibold"
            style={{
              background: 'var(--admin-accent-soft)',
              border:     '1px solid var(--admin-sidebar-border)',
              color:      'var(--admin-sidebar-mint)',
            }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="text-[12.5px] font-semibold truncate leading-tight"
              style={{ color: 'var(--admin-text)' }}
            >
              {user?.email ?? 'employee'}
            </div>
            <div
              className="text-[10.5px] uppercase tracking-[0.08em] mt-0.5 leading-tight"
              style={{ color: 'var(--admin-sidebar-fg-muted)' }}
            >
              Employee
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

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close mobile drawer on route change.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Pretty-print the current path as a breadcrumb label.
  const crumb = location.pathname === '/employee'
    ? 'Dashboard'
    : location.pathname
        .replace('/employee/', '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="admin-shell h-screen flex overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex md:w-[240px] lg:w-[256px] shrink-0 flex-col"
        style={{
          background:  'var(--admin-sidebar)',
          borderRight: '1px solid var(--admin-sidebar-border)',
        }}
      >
        <SidebarContent user={user} onLogout={onLogout} onLinkClick={undefined} />
      </aside>

      {/* ── Mobile drawer backdrop ────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/70 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile slide-in drawer ─────────────────────────────────────── */}
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

      {/* ── Main column ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop top header */}
        <header
          className="hidden md:flex items-center justify-between px-6 h-14 shrink-0"
          style={{
            background:           'rgba(255,255,255,0.85)',
            backdropFilter:       'saturate(180%) blur(14px)',
            WebkitBackdropFilter: 'saturate(180%) blur(14px)',
            borderBottom:         '1px solid var(--admin-border)',
          }}
        >
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-700">{crumb}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Notifications bell — Phase 4 will wire up the unread count.
                For now it's purely visual so the topbar isn't empty. */}
            <button
              type="button"
              className="relative p-2 rounded-md text-slate-500 hover:text-brand-700 hover:bg-slate-100 transition-all duration-150"
              title="Notifications (coming soon)"
              aria-label="Notifications"
            >
              {Icon.bell}
            </button>

            {/* User chip */}
            <div
              className="flex items-center gap-2.5 pl-3 ml-1"
              style={{ borderLeft: '1px solid var(--admin-border)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
              >
                <span className="text-white text-xs font-bold">
                  {user?.email?.[0]?.toUpperCase() ?? 'E'}
                </span>
              </div>
              <div className="hidden lg:block leading-tight">
                <div className="text-[13px] font-semibold text-slate-800">
                  {user?.email?.split('@')[0]}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Employee</div>
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
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
            >
              <span className="text-white text-xs font-bold leading-none">K</span>
            </div>
            <span className="text-base font-semibold text-slate-900 tracking-tight">Portal</span>
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
            background:   '#fff',
            color:        '#111827',
            boxShadow:    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            borderRadius: '10px',
            border:       '1px solid #E5E7EB',
            fontSize:     '13px',
            fontWeight:   500,
            fontFamily:   'Inter, system-ui, sans-serif',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
        }}
      />
    </div>
  );
}
