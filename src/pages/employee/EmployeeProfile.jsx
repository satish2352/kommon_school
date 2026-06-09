import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import {
  PageHeader,
  Card,
  Button,
  Input,
} from '../../components/admin';

/**
 * EmployeeProfile
 * ---------------
 * Read-only account info + change-password form. Profile editing
 * (display name, phone) is intentionally out of scope here — the admin
 * "Employees" management page (Phase 3D) owns identity edits. This page
 * is for the user's own daily concerns: see who they are, rotate
 * their password, log out.
 */

function isStrongEnough(pwd) {
  // Server enforces min 8, max 128. We mirror the floor and add a few
  // friendly checks so the UI doesn't bounce a request the server can
  // accept. We don't enforce complexity — that's a policy decision the
  // backend should own when it's added.
  if (!pwd) return { ok: false, reason: 'Password is required' };
  if (pwd.length < 8)  return { ok: false, reason: 'Use at least 8 characters' };
  if (pwd.length > 128) return { ok: false, reason: 'Max 128 characters' };
  return { ok: true };
}

export default function EmployeeProfile() {
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const [fieldErrors, setFieldErrors]         = useState({});

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFieldErrors({});
  };

  const submit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!currentPassword) errors.currentPassword = 'Required';
    const strength = isStrongEnough(newPassword);
    if (!strength.ok)  errors.newPassword = strength.reason;
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'New passwords do not match';
    }
    if (newPassword && newPassword === currentPassword) {
      errors.newPassword = 'New password must differ from current';
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Password updated. Please sign in again.');
      // The backend rotates refresh tokens but doesn't kill the current
      // session; we log out explicitly so the user re-authenticates with
      // the new credential and stale tabs go to /login.
      await logout();
    } catch (err) {
      // The auth service surfaces server-side codes:
      //   INVALID_CURRENT_PASSWORD → message points at the right field
      //   SAME_PASSWORD            → same
      if (err?.code === 'INVALID_CURRENT_PASSWORD') {
        setFieldErrors({ currentPassword: 'Current password is incorrect' });
      } else if (err?.code === 'SAME_PASSWORD') {
        setFieldErrors({ newPassword: 'New password must differ from current' });
      } else {
        toast.error(err?.message || 'Failed to update password');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Your account and security settings."
      />

      {/* Account info — read-only. Admin-managed in Phase 3D. */}
      <Card title="Account">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm max-w-xl">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email</dt>
            <dd className="text-slate-900 font-medium">{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Role</dt>
            <dd className="text-slate-900 font-medium">{user?.role ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">User ID</dt>
            <dd className="font-mono text-[11px] text-slate-500 break-all">{user?.id ?? '—'}</dd>
          </div>
        </dl>
        <p className="text-[11px] text-slate-400 mt-5 pt-4 border-t border-slate-100">
          Contact your admin to update your email or role.
        </p>
      </Card>

      {/* Change password */}
      <Card title="Change password" subtitle="You'll be signed out after a successful change.">
        <form onSubmit={submit} className="space-y-4 max-w-md">
          <Input
            label="Current password"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={fieldErrors.currentPassword}
          />
          <Input
            label="New password"
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint="8–128 characters."
            error={fieldErrors.newPassword}
          />
          <Input
            label="Confirm new password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
          />
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" variant="primary" loading={submitting}>
              Update password
            </Button>
            <Button type="button" variant="secondary" onClick={reset} disabled={submitting}>
              Reset form
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
