import { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const NAV_MAIN = [
  {
    to: '/admin',
    end: true,
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/admin/enrollments',
    label: 'Enrollments',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5m6 0v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 0H9" />
      </svg>
    ),
  },
  {
    to: '/admin/payments',
    label: 'Payments',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    to: '/admin/follow-ups',
    label: 'Follow-ups',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.5 10.5a11.037 11.037 0 004.999 5l1.113-1.724a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    to: '/admin/webhooks',
    label: 'Webhooks',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
];

const COURSES_GROUP = {
  label: 'Courses',
  basePaths: ['/admin/courses', '/admin/education-master', '/admin/duration-master'],
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  children: [
    {
      to: '/admin/courses',
      label: 'Courses',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      to: '/admin/education-master',
      label: 'Education Master',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      ),
    },
    {
      to: '/admin/duration-master',
      label: 'Duration Master',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ],
};

function NavItem({ item, onLinkClick, nested = false }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onLinkClick}
      className={({ isActive }) =>
        `flex items-center gap-3 ${nested ? 'pl-9 pr-3' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 relative ${
          isActive
            ? 'bg-white/10 text-white before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-full before:bg-emerald-500'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
            {item.icon}
          </span>
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function NavGroup({ group, onLinkClick }) {
  const location = useLocation();
  const isChildActive = useMemo(
    () => group.basePaths.some((p) => location.pathname === p || location.pathname.startsWith(p + '/')),
    [location.pathname, group.basePaths],
  );
  const [open, setOpen] = useState(isChildActive);

  // Auto-open whenever the user navigates into one of the children
  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
          isChildActive
            ? 'text-white'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <span className={`shrink-0 ${isChildActive ? 'text-emerald-400' : 'text-slate-500'}`}>
          {group.icon}
        </span>
        <span className="truncate flex-1 text-left">{group.label}</span>
        <svg
          className={`w-4 h-4 shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-0.5 mt-0.5">
          {group.children.map((item) => (
            <NavItem key={item.to} item={item} onLinkClick={onLinkClick} nested />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Sidebar content — shared between permanent desktop sidebar and mobile drawer.
 */
function SidebarContent({ onLinkClick, user, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo / brand */}
      <div className="px-5 py-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Wordmark icon */}
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold leading-none">K</span>
          </div>
          <div>
            <div className="text-base font-bold text-white tracking-tight leading-tight">Kommon</div>
            <div className="text-[10px] text-slate-400 leading-tight uppercase tracking-widest">Admin Console</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {/* Main nav */}
        <div className="space-y-0.5">
          {NAV_MAIN.map((item) => (
            <NavItem key={item.to} item={item} onLinkClick={onLinkClick} />
          ))}
        </div>

        {/* Courses group — collapsible parent containing the 3 master pages */}
        <div className="mt-2">
          <NavGroup group={COURSES_GROUP} onLinkClick={onLinkClick} />
        </div>
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1 shrink-0">
        <div className="px-3 py-1.5 rounded-lg bg-white/5 mb-1">
          <div className="text-xs font-semibold text-white truncate">{user?.email}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{user?.role}</div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-900/30 hover:text-red-300 transition-colors duration-150"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
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
    // admin-shell scopes Inter font + theme variables to the admin panel only.
    // h-screen + overflow-hidden so the outer shell never scrolls.
    // The sidebar inherits full height as a flex child; only <main> scrolls.
    <div className="admin-shell h-screen bg-[#F8FAFC] flex overflow-hidden">

      {/* ── Desktop / tablet permanent sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex md:w-[220px] lg:w-[260px] shrink-0 bg-[#0F172A] flex-col">
        <SidebarContent user={user} onLogout={onLogout} onLinkClick={undefined} />
      </aside>

      {/* ── Mobile drawer backdrop ─────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile slide-in drawer ──────────────────────────────────────────── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        {/* Close button inside drawer */}
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors duration-150"
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

      {/* ── Main content column ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top header bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-4 bg-white border-b border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-150"
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold leading-none">K</span>
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">Kommon</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
            aria-label="Sign out"
            title={`Sign out (${user?.email ?? ''})`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </header>

        {/* overflow-y-auto makes this the scroll container, not the document */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 py-6 md:px-6 md:py-8 lg:px-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Single Toaster instance for all admin pages */}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
}
