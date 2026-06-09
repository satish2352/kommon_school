import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { adminEmployeeService } from '../../services/adminEmployeeService';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  Table,
  Th,
  Td,
  Tr,
  Skeleton,
  EmptyState,
} from '../../components/admin';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const COLS = ['Email', 'Status', 'Created', 'Actions'];

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return '—'; }
};

function isStrongEnough(pwd) {
  if (!pwd)              return { ok: false, reason: 'Password is required' };
  if (pwd.length < 8)    return { ok: false, reason: 'Use at least 8 characters' };
  if (pwd.length > 128)  return { ok: false, reason: 'Max 128 characters' };
  return { ok: true };
}

function isValidEmail(s) {
  // Same forgiving check as the rest of the admin app — backend
  // re-validates with Joi.string().email().
  return typeof s === 'string' && /^\S+@\S+\.\S+$/.test(s.trim());
}

/* ─── Create / Edit / Reset modals ──────────────────────────────────────── */

function CreateEmployeeModal({ open, onClose, onCreated }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [busy, setBusy]         = useState(false);
  const [errors, setErrors]     = useState({});

  useEffect(() => {
    if (!open) {
      // Clear state on close so opening a fresh dialog isn't stale.
      setEmail(''); setPassword(''); setConfirm(''); setErrors({});
    }
  }, [open]);

  const submit = async (e) => {
    e?.preventDefault?.();
    const errs = {};
    if (!isValidEmail(email))      errs.email    = 'Enter a valid email';
    const s = isStrongEnough(password);
    if (!s.ok)                     errs.password = s.reason;
    if (password !== confirm)      errs.confirm  = 'Passwords do not match';
    if (Object.keys(errs).length)  { setErrors(errs); return; }

    setBusy(true);
    setErrors({});
    try {
      const user = await adminEmployeeService.create({
        email:    email.trim().toLowerCase(),
        password,
      });
      toast.success('Employee created');
      onCreated?.(user);
      onClose?.();
    } catch (err) {
      // Backend returns 409 conflict for duplicate email
      if (err?.status === 409 || /already exists/i.test(err?.message || '')) {
        setErrors({ email: 'A user with that email already exists' });
      } else {
        toast.error(err?.message || 'Failed to create employee');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create employee">
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          required
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoFocus
        />
        <Input
          label="Initial password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="8–128 characters. Share with the employee out-of-band."
        />
        <Input
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={busy}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ open, onClose, employee, onReset }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [busy, setBusy]         = useState(false);
  const [errors, setErrors]     = useState({});

  useEffect(() => {
    if (!open) {
      setPassword(''); setConfirm(''); setErrors({});
    }
  }, [open]);

  const submit = async (e) => {
    e?.preventDefault?.();
    const errs = {};
    const s = isStrongEnough(password);
    if (!s.ok)                errs.password = s.reason;
    if (password !== confirm) errs.confirm  = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setBusy(true);
    setErrors({});
    try {
      await adminEmployeeService.resetPassword(employee.id, password);
      toast.success(`Password reset for ${employee.email}`);
      onReset?.();
      onClose?.();
    } catch (err) {
      // Backend rejects modifying self via this endpoint.
      if (err?.code === 'CANNOT_MODIFY_SELF') {
        toast.error('Use your Profile page to change your own password');
        onClose?.();
      } else {
        toast.error(err?.message || 'Failed to reset password');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Reset password">
      <form onSubmit={submit} className="space-y-4">
        <div className="text-xs text-slate-500">
          Reset password for <span className="font-mono">{employee?.email}</span>.
          Share the new password with them out-of-band.
        </div>
        <Input
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="8–128 characters."
          autoFocus
        />
        <Input
          label="Confirm new password"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={busy}>
            Reset password
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Skeleton rows ─────────────────────────────────────────────────────── */

function SkeletonRows({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Tr key={i} striped={i % 2 === 1}>
          {COLS.map((_h, j) => (
            <Td key={j}><Skeleton w="w-24" /></Td>
          ))}
        </Tr>
      ))}
    </>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function EmployeesManagement() {
  const [page, setPage]                     = useState(1);
  const [search, setSearch]                 = useState('');
  const [debouncedSearch, setDebSearch]     = useState('');
  const [statusFilter, setStatusFilter]     = useState('active');

  // Debounce search keystrokes.
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const filters = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    ...(statusFilter           ? { status: statusFilter }            : {}),
  }), [page, debouncedSearch, statusFilter]);

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminEmployeeService.listFull(filters)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e)  => { if (!cancelled) setError(e); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters, reloadKey]);

  // The /admin/users endpoint returns rows in the canonical paginated shape
  // — items + meta come either inline or under `meta`. Defensive defaults.
  const items      = Array.isArray(data?.items) ? data.items
                   : Array.isArray(data)         ? data
                   : Array.isArray(data?.data)   ? data.data
                   : [];
  const total      = Number(data?.total ?? data?.meta?.total ?? items.length);
  const totalPages = Math.max(1, Number(data?.totalPages ?? data?.meta?.totalPages ?? 1));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Modal state
  const [createOpen, setCreateOpen]       = useState(false);
  const [resetTarget, setResetTarget]     = useState(null); // employee object or null
  const [busyId, setBusyId]               = useState(null);

  const doDeactivate = async (emp) => {
    if (!window.confirm(`Deactivate ${emp.email}? They will no longer be able to log in.`)) return;
    setBusyId(emp.id);
    try {
      await adminEmployeeService.deactivate(emp.id);
      toast.success('Employee deactivated');
      refetch();
    } catch (err) {
      if (err?.code === 'CANNOT_MODIFY_SELF') {
        toast.error('You cannot deactivate your own account');
      } else {
        toast.error(err?.message || 'Failed to deactivate');
      }
    } finally {
      setBusyId(null);
    }
  };

  const doReactivate = async (emp) => {
    setBusyId(emp.id);
    try {
      await adminEmployeeService.reactivate(emp.id);
      toast.success('Employee reactivated');
      refetch();
    } catch (err) {
      toast.error(err?.message || 'Failed to reactivate');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle="Create and manage follow-up team accounts."
        action={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            + Create employee
          </Button>
        }
      />

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <Input
              label="Search by email"
              type="search"
              placeholder="someone@example.com"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-44">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="active">Active</option>
              <option value="deleted">Deactivated</option>
              <option value="">All</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* ── Error state ────────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error.message || 'Failed to load employees.'}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <Card variant="flush">
        <Table>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {COLS.map((h) => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <SkeletonRows />}

            {!loading && !error && items.length === 0 && (
              <EmptyState
                colSpan={COLS.length}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-9a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
                title="No employees yet"
                description={'Click "Create employee" to onboard your first follow-up team member.'}
              />
            )}

            {!loading && !error && items.map((emp, idx) => {
              const isDeleted = emp.deleted_at != null;
              return (
                <Tr key={emp.id} striped={idx % 2 === 1}>
                  <Td className="text-slate-900 font-medium">
                    {emp.email}
                    <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                      {emp.id}
                    </div>
                  </Td>
                  <Td>
                    {isDeleted
                      ? <Badge variant="neutral">Deactivated</Badge>
                      : <Badge variant="success">Active</Badge>}
                  </Td>
                  <Td className="text-slate-500 text-xs">
                    {fmtDateTime(emp.created_at)}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setResetTarget(emp)}
                        disabled={busyId === emp.id}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-700 transition-colors disabled:opacity-50"
                        title="Set a new password for this employee"
                      >
                        Reset password
                      </button>
                      {isDeleted ? (
                        <button
                          type="button"
                          onClick={() => doReactivate(emp)}
                          disabled={busyId === emp.id}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => doDeactivate(emp)}
                          disabled={busyId === emp.id}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-red-200 bg-white text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 pb-2">
        <div>{total} total</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Prev
          </button>
          <span className="px-3 py-1.5 text-slate-600">Page {page} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <CreateEmployeeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { refetch(); }}
      />
      <ResetPasswordModal
        open={Boolean(resetTarget)}
        employee={resetTarget}
        onClose={() => setResetTarget(null)}
        onReset={() => refetch()}
      />
    </div>
  );
}
