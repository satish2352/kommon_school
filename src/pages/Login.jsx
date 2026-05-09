import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password, tenantId: tenantId || undefined });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="admin-shell min-h-screen bg-[#F8FAFC] flex">
      {/* ── Left decorative panel (hidden on mobile) ─────────────────────── */}
      <div className="hidden md:flex md:w-1/2 lg:w-2/5 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] flex-col justify-between p-10 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5" />

        {/* Brand top */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-lg font-bold leading-none">K</span>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">Kommon</span>
          </div>
        </div>

        {/* Center tagline */}
        <div className="relative z-10">
          <h2 className="text-white text-3xl font-bold leading-snug">
            Manage your school,<br />
            <span className="text-emerald-400">effortlessly.</span>
          </h2>
          <p className="text-slate-300 text-sm mt-4 leading-relaxed max-w-xs">
            The all-in-one admin console for enrollments, payments, follow-ups, and course management.
          </p>
        </div>

        {/* Bottom credits */}
        <div className="relative z-10">
          <p className="text-slate-400 text-xs">
            &copy; {new Date().getFullYear()} Kommon School. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right side: form ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="md:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                <span className="text-white text-base font-bold leading-none">K</span>
              </div>
              <span className="text-slate-900 text-xl font-bold tracking-tight">Kommon</span>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)] p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
              <p className="text-sm text-slate-500 mt-1">Admin and staff console</p>
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors duration-200"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors duration-200"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="login-tenant" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tenant ID{' '}
                  <span className="font-normal text-slate-400">(optional, leave blank for super admin)</span>
                </label>
                <input
                  id="login-tenant"
                  type="text"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors duration-200"
                  placeholder="cmoscxr3i00011gg7x77tftvi"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 mt-1"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              <Link to="/" className="hover:text-emerald-600 transition-colors duration-200">
                ← Back to website
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
