import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

/* ── Icons (line style, matches the admin console) ──────────────────────── */
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
  receipt: (
    <svg {...iconProps}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  ),
  cart: (
    <svg {...iconProps}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  logout: (
    <svg {...iconProps}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { to: '/panel', end: true, label: 'Dashboard', icon: Icon.dashboard },
  { to: '/panel/purchase', label: 'Buy a Plan', icon: Icon.cart },
  { to: '/panel/transactions', label: 'Transaction History', icon: Icon.receipt },
];

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
  const initial = (user?.email?.[0] ?? 'U').toUpperCase();
  const role = user?.role ?? 'Student';
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 h-[60px] flex items-center shrink-0">
        <div className="flex items-baseline gap-0.5 leading-none">
          <span className="text-[17px] font-bold tracking-tight" style={{ color: 'var(--admin-sidebar-mint)' }}>
            Kommon
          </span>
          <span className="text-[13px] font-semibold tracking-tight" style={{ color: 'var(--admin-text)' }}>
            School
          </span>
        </div>
      </div>

      <div className="h-px shrink-0" style={{ background: 'var(--admin-sidebar-border)' }} />

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <div className="px-3 pt-1 pb-1.5">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: 'var(--admin-sidebar-fg-muted)' }}
          >
            My Account
          </span>
        </div>
        <div className="space-y-0.5 px-1">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} item={item} onLinkClick={onLinkClick} />
          ))}
        </div>
      </nav>

      {/* Footer — user row + sign-out */}
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
            <div className="text-[12.5px] font-semibold truncate leading-tight" style={{ color: 'var(--admin-text)' }}>
              {user?.email ?? 'you@kommon'}
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

export default function PanelLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // The mobile drawer closes via onLinkClick on every nav link (and the
  // backdrop / close button), so no route-change effect is needed here.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const pageTitle =
    location.pathname === '/panel'
      ? 'Dashboard'
      : location.pathname.replace('/panel/', '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="admin-shell h-screen flex overflow-hidden" style={{ background: 'var(--admin-bg)' }}>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:w-[240px] lg:w-[256px] shrink-0 flex-col"
        style={{ background: 'var(--admin-sidebar)', borderRight: '1px solid var(--admin-sidebar-border)' }}
      >
        <SidebarContent user={user} onLogout={onLogout} onLinkClick={undefined} />
      </aside>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/70 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
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
        <SidebarContent user={user} onLogout={onLogout} onLinkClick={() => setDrawerOpen(false)} />
      </div>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header */}
        <header
          className="hidden md:flex items-center justify-between px-6 h-14 shrink-0"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'saturate(180%) blur(14px)',
            WebkitBackdropFilter: 'saturate(180%) blur(14px)',
            borderBottom: '1px solid var(--admin-border)',
          }}
        >
          <div className="flex items-center gap-2 text-[13px]">
            <span className="font-medium text-slate-700">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2.5 pl-3" style={{ borderLeft: '1px solid var(--admin-border)' }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
              >
                <span className="text-white text-xs font-bold">{user?.email?.[0]?.toUpperCase() ?? 'U'}</span>
              </div>
              <div className="hidden lg:block leading-tight">
                <div className="text-[13px] font-semibold text-slate-800">{user?.email?.split('@')[0]}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{user?.role ?? 'student'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile header */}
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

        {/* Scroll container */}
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
          success: { iconTheme: { primary: '#2563EB', secondary: '#fff' } },
        }}
      />
    </div>
  );
}
