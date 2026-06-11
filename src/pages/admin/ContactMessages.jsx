import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { adminContactService } from '../../services/adminContactService';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Modal,
  Table,
  Th,
  Td,
  Tr,
  Pagination,
  PageLoader,
  EmptyState,
} from '../../components/admin';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const STATUSES = ['NEW', 'READ', 'REPLIED', 'SPAM', 'ARCHIVED'];

const STATUS_STYLES = {
  NEW:      'bg-blue-50 text-blue-700',
  READ:     'bg-slate-100 text-slate-600',
  REPLIED:  'bg-emerald-50 text-emerald-700',
  SPAM:     'bg-amber-50 text-amber-700',
  ARCHIVED: 'bg-slate-100 text-slate-400',
};

const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

const COL_COUNT = 7;

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function ContactMessages() {
  const [records, setRecords]       = useState([]);
  const [meta, setMeta]             = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [busyId, setBusyId]         = useState(null);
  const [viewMsg, setViewMsg]       = useState(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminContactService
      .list({ page, limit, search, status: statusFilter })
      .then(({ records: rows, meta: m }) => { if (!cancelled) { setRecords(rows); setMeta(m); } })
      .catch((err) => { if (!cancelled) setError(err.message ?? 'Failed to load messages'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, limit, search, statusFilter, refreshKey]);

  const filtersActive = searchInput.trim() !== '' || statusFilter !== 'ALL';
  const resetFilters = () => { setSearchInput(''); setSearch(''); setStatusFilter('ALL'); setPage(1); };

  const handleStatusChange = async (rec, status) => {
    if (status === rec.status) return;
    setBusyId(rec.id);
    try {
      await adminContactService.updateStatus(rec.id, status);
      toast.success(`Marked as ${status.toLowerCase()}`);
      refresh();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Messages"
        subtitle="Enquiries submitted through the website “Send Us a Message” form"
      />

      {/* Filter bar */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, phone, message…"
            className="w-full sm:w-72"
          />
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full sm:w-auto">
            <option value="ALL">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Button variant="secondary" onClick={resetFilters} disabled={!filtersActive} className="w-full sm:w-auto">Reset</Button>
        </div>
      </Card>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Table — desktop / tablet */}
      <Card variant="flush" className="hidden md:block">
        <Table>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Sr No', 'Name', 'Email', 'Phone', 'Message', 'Status', 'Submitted'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={COL_COUNT}><PageLoader label="Loading messages…" minH="min-h-[200px]" /></td></tr>
            )}

            {!loading && !error && records.length === 0 && (
              <EmptyState
                colSpan={COL_COUNT}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
                title={filtersActive ? 'No messages match your filters' : 'No messages yet'}
                description={filtersActive ? 'Try adjusting your search or filter.' : 'Website enquiries will appear here.'}
              />
            )}

            {!loading && !error && records.map((rec, idx) => (
              <Tr key={rec.id} striped={idx % 2 === 1}>
                <Td className="text-slate-500 text-sm font-mono">{(meta.page - 1) * meta.limit + idx + 1}</Td>
                <Td className="text-slate-900 font-medium">{rec.name}</Td>
                <Td className="text-slate-600 text-sm">{rec.email}</Td>
                <Td className="text-slate-600 text-sm whitespace-nowrap">{rec.phone || '—'}</Td>
                <Td className="text-slate-600 text-sm align-top whitespace-normal w-[280px] max-w-[280px]">
                  <button
                    type="button"
                    onClick={() => setViewMsg(rec)}
                    className="block text-left text-brand-600 hover:text-brand-800 hover:underline line-clamp-2 whitespace-normal break-words"
                    title="View full message"
                  >
                    {rec.message}
                  </button>
                </Td>
                <Td>
                  <Select
                    value={rec.status}
                    disabled={busyId === rec.id}
                    onChange={(e) => handleStatusChange(rec, e.target.value)}
                    className={`w-auto !h-8 !py-1 text-xs font-semibold ${STATUS_STYLES[rec.status] ?? ''}`}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </Td>
                <Td className="text-slate-500 text-xs whitespace-nowrap">{formatDateTime(rec.created_at)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Card list — mobile */}
      <div className="md:hidden space-y-3">
        {loading && <Card><PageLoader label="Loading messages…" minH="min-h-[160px]" /></Card>}

        {!loading && !error && records.length === 0 && (
          <Card>
            <p className="text-center text-sm text-slate-400 py-6">
              {filtersActive ? 'No messages match your filters.' : 'No messages yet.'}
            </p>
          </Card>
        )}

        {!loading && !error && records.map((rec, idx) => (
          <Card key={rec.id}>
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-mono text-slate-400">
                    #{(meta.page - 1) * meta.limit + idx + 1}
                  </div>
                  <div className="font-semibold text-slate-900 truncate">{rec.name}</div>
                  <div className="text-xs text-slate-500 break-all">{rec.email}</div>
                  {rec.phone && <div className="text-xs text-slate-500">{rec.phone}</div>}
                </div>
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[rec.status] ?? ''}`}>
                  {rec.status}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setViewMsg(rec)}
                className="text-left text-sm text-slate-600 line-clamp-3 w-full hover:text-slate-900"
                title="View full message"
              >
                {rec.message}
              </button>

              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">{formatDateTime(rec.created_at)}</span>
                <Select
                  value={rec.status}
                  disabled={busyId === rec.id}
                  onChange={(e) => handleStatusChange(rec, e.target.value)}
                  className={`w-auto !h-8 !py-1 text-xs font-semibold ${STATUS_STYLES[rec.status] ?? ''}`}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(v) => { setLimit(Number(v)); setPage(1); }}
      />

      {/* View message modal */}
      <Modal
        isOpen={!!viewMsg}
        onClose={() => setViewMsg(null)}
        title="Contact Message"
        widthClass="max-w-lg"
        footer={<Button variant="secondary" onClick={() => setViewMsg(null)}>Close</Button>}
      >
        {viewMsg && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><div className="text-xs text-slate-400">Name</div><div className="font-medium text-slate-800">{viewMsg.name}</div></div>
              <div><div className="text-xs text-slate-400">Submitted</div><div className="font-medium text-slate-800">{formatDateTime(viewMsg.created_at)}</div></div>
              <div><div className="text-xs text-slate-400">Email</div><div className="font-medium text-slate-800 break-all">{viewMsg.email}</div></div>
              <div><div className="text-xs text-slate-400">Phone</div><div className="font-medium text-slate-800">{viewMsg.phone || '—'}</div></div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Message</div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-700 whitespace-pre-wrap">{viewMsg.message}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
