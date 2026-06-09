import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { emailLogService } from '../../services/emailLogService';
import { PageHeader, Card, Button, Input, Select, Badge, Table, Th, Td, Tr, EmptyState, Pagination } from '../../components/admin';

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const STATUS_VARIANT = { sent: 'success', failed: 'danger', skipped: 'warning' };

const formatDateTime = (iso) => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export default function EmailLogs() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [status, setStatus] = useState('');

  // Resend-to-any-email box.
  const [resendEmail, setResendEmail] = useState('');
  const [resendingKey, setResendingKey] = useState(null); // email currently resending

  // Filter changes reset to page 1 — handled in the onChange handlers below
  // (onSearchChange / onStatusChange) rather than an effect.

  const genRef = useRef(0);
  const load = useCallback(async () => {
    const gen = ++genRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await emailLogService.list({ page, limit: 25, search: debouncedSearch, status });
      if (gen !== genRef.current) return;
      setRows(result.rows);
      setMeta(result.meta);
    } catch (err) {
      if (gen !== genRef.current) return;
      setError(err.message ?? 'Failed to load email logs');
    } finally {
      if (gen === genRef.current) setLoading(false);
    }
  }, [page, debouncedSearch, status]);

  // Fetch whenever the query inputs change. Mirrors the established list-page
  // pattern (see SumagoUsers); load() manages its own loading flag.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const onSearchChange = (e) => { setSearchInput(e.target.value); setPage(1); };
  const onStatusChange = (e) => { setStatus(e.target.value); setPage(1); };

  const doResend = async (email) => {
    if (!email) return;
    const confirmed = window.confirm(
      `Resend onboarding credentials to ${email}?\n\nIf an account already exists, its password will be RESET to a new temporary one and all existing sessions will be signed out.`,
    );
    if (!confirmed) return;
    setResendingKey(email);
    try {
      const res = await emailLogService.resendOnboarding(email);
      const action = res?.accountAction === 'password_reset'
        ? 'password reset'
        : res?.accountAction === 'account_created' ? 'account created' : 'sent';
      if (res?.emailStatus === 'sent') {
        toast.success(`Onboarding email sent to ${email} (${action})`);
      } else if (res?.emailStatus === 'skipped') {
        toast(`Skipped — mail is disabled on the server`, { icon: '⚠️' });
      } else {
        toast.error(`Send failed: ${res?.error ?? 'unknown error'}`);
      }
      load();
    } catch (err) {
      toast.error(err.message ?? 'Resend failed');
    } finally {
      setResendingKey(null);
    }
  };

  const onResendBox = (e) => {
    e.preventDefault();
    const email = resendEmail.trim();
    if (!email) return;
    doResend(email).then(() => setResendEmail(''));
  };

  const showingFrom = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const showingTo = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Log"
        subtitle="Every onboarding email the system attempted — who it went to, and whether it was delivered"
      />

      {/* Resend to any email */}
      <Card title="Resend onboarding credentials">
        <form onSubmit={onResendBox} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[260px]">
            <label htmlFor="resend-email" className="block text-[13px] font-medium text-slate-600 mb-1.5">
              Student email
            </label>
            <Input
              id="resend-email"
              type="email"
              placeholder="student@example.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
            />
          </div>
          <Button type="submit" loading={resendingKey === resendEmail.trim() && !!resendEmail} disabled={!resendEmail.trim()}>
            Resend credentials
          </Button>
        </form>
        <p className="text-[12px] text-slate-500 mt-2">
          Sends the login email with a fresh temporary password. If the student already has an account,
          its password is reset (the old temporary one can’t be recovered) and existing sessions are signed out.
        </p>
      </Card>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <Card title={`Sent history (${meta.total ?? 0})`} variant="flush">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 p-4 border-b" style={{ borderColor: 'var(--admin-border)' }}>
          <div className="flex-1 min-w-[220px] max-w-md">
            <Input
              placeholder="Search by email…"
              value={searchInput}
              onChange={onSearchChange}
            />
          </div>
          <Select value={status} onChange={onStatusChange}>
            <option value="">All statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </Select>
          <div className="text-xs text-slate-500 ml-auto">
            {meta.total > 0 && (<>Showing <b>{showingFrom}–{showingTo}</b> of <b>{meta.total}</b></>)}
          </div>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>Recipient</Th>
              <Th>Status</Th>
              <Th>Trigger</Th>
              <Th>Detail</Th>
              <Th>Sent at</Th>
              <Th align="right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <EmptyState
                colSpan={6}
                title="No emails logged yet"
                description="Onboarding emails appear here as students enroll. You can also resend credentials above."
              />
            ) : (
              rows.map((r, i) => (
                <Tr key={r.id ?? i} striped={i % 2 === 1}>
                  <Td className="font-medium text-slate-800">{r.to_email}</Td>
                  <Td>
                    <Badge variant={STATUS_VARIANT[r.status] ?? 'neutral'}>{r.status}</Badge>
                  </Td>
                  <Td className="text-slate-600">
                    {r.triggered_by ? `Admin (${r.triggered_by})` : 'Auto (enrollment)'}
                  </Td>
                  <Td className="text-slate-500 max-w-[280px] truncate" title={r.error || r.reason || r.message_id || ''}>
                    {r.status === 'failed'
                      ? (r.error || '—')
                      : r.status === 'skipped'
                      ? (r.reason || '—')
                      : (r.message_id || '—')}
                  </Td>
                  <Td className="text-slate-500 whitespace-nowrap">{formatDateTime(r.created_at)}</Td>
                  <Td align="right">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={resendingKey === r.to_email}
                      onClick={() => doResend(r.to_email)}
                    >
                      Resend
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>

        <div className="p-4">
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={setPage}
          />
        </div>
      </Card>
    </div>
  );
}
