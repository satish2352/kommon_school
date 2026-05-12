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
    <div className="admin-shell min-h-screen flex" style={{ background: '#F9FAFB' }}>

      {/* ── Left decorative panel — dark for Stripe-style split login ─── */}
      <div className="hidden md:flex md:w-5/12 lg:w-2/5 flex-col p-10 relative overflow-hidden gap-8"
        style={{ background: '#0F172A' }}>

        {/* Subtle background grid */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="admingrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#admingrid)" />
          </svg>
        </div>

        {/* Decorative glows */}
        <div className="absolute top-1/4 -right-20 w-56 h-56 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #60A5FA, transparent 70%)' }} />
        <div className="absolute bottom-1/4 -left-10 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2563EB, transparent 70%)' }} />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold leading-none">K</span>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">Kommon</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-400/10 border border-brand-400/20 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-brand-300 text-xs font-medium">Admin Console</span>
          </div>
          <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">
            Manage your school,<br />
            <span style={{ background: 'linear-gradient(90deg, #60A5FA, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              effortlessly.
            </span>
          </h2>
          <p className="text-brand-200/60 text-sm mt-3 leading-relaxed max-w-xs">
            The all-in-one admin console for enrollments, payments, follow-ups, and course management.
          </p>

          {/* Feature list */}
          <div className="space-y-3 mt-5">
            {[
              { icon: '📋', text: 'Enrollment & bulk upload management' },
              { icon: '💳', text: 'Real-time payment tracking' },
              { icon: '📞', text: 'Follow-up pipeline & scheduling' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-400/10 flex items-center justify-center text-sm shrink-0">
                  {f.icon}
                </div>
                <span className="text-brand-200/70 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Right form side ─── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Mobile brand */}
          <div className="md:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md">
                <span className="text-white text-base font-bold leading-none">K</span>
              </div>
              <span className="text-slate-900 text-xl font-bold tracking-tight">Kommon</span>
            </div>
            <p className="text-slate-500 text-sm">Admin Console</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-xl border shadow-card p-8" style={{ borderColor: 'var(--admin-border, #E5E7EB)' }}>
            {/* Header */}
            <div className="mb-7">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Sign in</h1>
              <p className="text-sm text-slate-500 mt-1">Admin and staff console</p>
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 h-9 rounded-[0.625rem] border text-[13px] text-slate-800 bg-white placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 transition-all duration-150"
                  style={{ borderColor: 'var(--admin-border, #E5E7EB)' }}
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="login-password" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 h-9 rounded-[0.625rem] border text-[13px] text-slate-800 bg-white placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 transition-all duration-150"
                  style={{ borderColor: 'var(--admin-border, #E5E7EB)' }}
                  placeholder="••••••••"
                />
              </div>

              {/* Tenant ID */}
              <div>
                <label htmlFor="login-tenant" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  Tenant ID{' '}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="login-tenant"
                  type="text"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full px-3 h-9 rounded-[0.625rem] border text-[13px] text-slate-800 bg-white font-mono placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 transition-all duration-150"
                  style={{ borderColor: 'var(--admin-border, #E5E7EB)' }}
                  placeholder="cmoscxr3i00011gg7x77tftvi"
                />
                <p className="text-[11px] text-slate-400 mt-1">Leave blank for super admin access</p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                  <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 px-6 rounded-[0.625rem] bg-brand-500 text-white text-sm font-medium
                  hover:bg-brand-600 hover:shadow-md
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                  transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2
                  shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="4" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-600 transition-colors duration-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to website
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
