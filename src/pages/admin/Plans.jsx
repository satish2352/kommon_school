import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { plansAdminService } from '../../services/plansAdminService';
import {
  PageHeader,
  Card,
  Button,
  IconButton,
  Input,
  Select,
  Modal,
  StatusToggle,
  Table,
  Th,
  Td,
  Tr,
  Pagination,
  PageLoader,
  EmptyState,
} from '../../components/admin';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const TIER_COLORS = {
  SILVER:   'bg-slate-100 text-slate-700',
  GOLD:     'bg-amber-100 text-amber-700',
  PLATINUM: 'bg-violet-100 text-violet-700',
};

function formatPrice(n) {
  if (n == null) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function lowestPrice(pricings) {
  const active = (pricings ?? []).filter((p) => p.status === 'ACTIVE');
  if (!active.length) return null;
  return Math.min(...active.map((p) => Number(p.finalPrice)));
}

function highestPrice(pricings) {
  const active = (pricings ?? []).filter((p) => p.status === 'ACTIVE');
  if (!active.length) return null;
  return Math.max(...active.map((p) => Number(p.finalPrice)));
}

/* ─── Column count ───────────────────────────────────────────────────────── */
const COL_COUNT = 8;

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const ViewIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EditIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const EnrollmentsIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const DeleteIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function Plans() {
  const navigate = useNavigate();

  /* ── List state ── */
  const [records, setRecords]       = useState([]);
  const [meta, setMeta]             = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /* ── Filter state ── */
  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]         = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  /* ── Delete confirm state ── */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ── Fetch data ── */
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    plansAdminService
      .list({ page, limit, search, tier: tierFilter !== 'ALL' ? tierFilter : undefined, status: statusFilter })
      .then(({ records: rows, meta: m }) => {
        if (!cancelled) { setRecords(rows); setMeta(m); }
      })
      .catch((err) => { if (!cancelled) setError(err.message ?? 'Failed to load plans'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, limit, search, tierFilter, statusFilter, refreshKey]);

  /* ── Handlers ── */
  const handleLimit  = (v) => { setLimit(Number(v)); setPage(1); };
  const handleTier   = (v) => { setTierFilter(v); setPage(1); };
  const handleStatus = (v) => { setStatusFilter(v); setPage(1); };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setTierFilter('ALL');
    setStatusFilter('ALL');
    setPage(1);
  };

  const handleToggleStatus = async (rec) => {
    if (rec.isSystemDefault) return;
    const newStatus = rec.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await plansAdminService.setStatus(rec.id, newStatus);
      toast.success(newStatus === 'ACTIVE' ? 'Plan activated' : 'Plan deactivated');
      refresh();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await plansAdminService.remove(deleteTarget.id);
      toast.success('Plan deleted');
      setDeleteTarget(null);
      if (records.length === 1 && page > 1) setPage((p) => p - 1);
      else refresh();
    } catch (err) {
      if (err?.code === 'PLAN_IN_USE') {
        toast.error('Cannot delete: plan is referenced by enrollments. Deactivate it instead.');
      } else {
        toast.error(err.message ?? 'Failed to delete plan');
      }
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="Plans"
        subtitle="Manage subscription and membership plans"
        action={
          <Button variant="primary" onClick={() => navigate('/admin/plans/new')}>
            Add Plan
          </Button>
        }
      />

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-wrap gap-3">
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or tagline..."
            className="w-60"
          />
          <Select value={tierFilter} onChange={(e) => handleTier(e.target.value)} className="w-auto">
            <option value="ALL">All tiers</option>
            <option value="SILVER">Silver</option>
            <option value="GOLD">Gold</option>
            <option value="PLATINUM">Platinum</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => handleStatus(e.target.value)} className="w-auto">
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <Button variant="secondary" onClick={resetFilters}>Reset</Button>
        </div>
      </Card>

      {/* ── Error state ──────────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <Card variant="flush">
        <Table>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Sr No', 'Name', 'Tier', 'Pricings', 'Lowest Price', 'Highest Price', 'Status', 'Actions'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={COL_COUNT}>
                  <PageLoader label="Loading plans…" minH="min-h-[200px]" />
                </td>
              </tr>
            )}

            {!loading && !error && records.length === 0 && (
              <EmptyState
                colSpan={COL_COUNT}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                }
                title={search || tierFilter !== 'ALL' || statusFilter !== 'ALL' ? 'No plans match your filters' : 'No plans yet'}
                description={search || tierFilter !== 'ALL' || statusFilter !== 'ALL' ? 'Try adjusting your search or filter.' : 'Add your first plan with the button above.'}
              />
            )}

            {!loading && !error && records.map((rec, idx) => {
              const isLocked      = !!rec.isSystemDefault;
              const allPricings   = rec.pricings ?? [];
              const activePricings = allPricings.filter((p) => p.status === 'ACTIVE');
              const low  = lowestPrice(allPricings);
              const high = highestPrice(allPricings);
              return (
                <Tr key={rec.id} striped={idx % 2 === 1}>
                  <Td className="text-slate-500 text-sm font-mono">{(meta.page - 1) * meta.limit + idx + 1}</Td>
                  <Td className="text-slate-900 font-medium max-w-xs truncate">
                    {rec.name}
                    {isLocked && (
                      <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 ml-1.5 align-middle">
                        System
                      </span>
                    )}
                    {rec.tagline && (
                      <div className="text-xs text-slate-400 font-normal mt-0.5 truncate">{rec.tagline}</div>
                    )}
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${TIER_COLORS[rec.tier] ?? 'bg-slate-100 text-slate-600'}`}>
                      {rec.tier}
                    </span>
                  </Td>
                  <Td className="text-slate-600 text-sm whitespace-nowrap">
                    {activePricings.length} active / {allPricings.length} total
                  </Td>
                  <Td className="text-slate-700 text-sm whitespace-nowrap">
                    {formatPrice(low)}
                  </Td>
                  <Td className="text-slate-700 text-sm whitespace-nowrap">
                    {formatPrice(high)}
                  </Td>
                  <Td>
                    <StatusToggle
                      status={rec.status}
                      isLocked={isLocked}
                      onToggle={() => handleToggleStatus(rec)}
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <IconButton
                        icon={ViewIcon}
                        variant="default"
                        title="View plan details"
                        onClick={() => navigate(`/admin/plans/${rec.id}/view`)}
                      />
                      <IconButton
                        icon={EditIcon}
                        variant="default"
                        title="Edit plan"
                        onClick={() => navigate(`/admin/plans/${rec.id}`)}
                      />
                      <IconButton
                        icon={EnrollmentsIcon}
                        variant="default"
                        title="View enrollments"
                        onClick={() => navigate(`/admin/plans/${rec.id}/enrollments`)}
                      />
                      <IconButton
                        icon={DeleteIcon}
                        variant="danger"
                        disabled={isLocked}
                        title={isLocked ? 'System default — cannot be deleted' : 'Delete plan'}
                        onClick={() => { if (isLocked) return; setDeleteTarget(rec); }}
                      />
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      <Pagination
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={handleLimit}
      />

      {/* ── Delete confirm modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete plan?"
        widthClass="max-w-sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete plan{' '}
          <span className="font-medium text-slate-900">&ldquo;{deleteTarget?.name}&rdquo;</span>?
          This action cannot be undone. Plans referenced by enrollments cannot be deleted — deactivate instead.
        </p>
      </Modal>
    </div>
  );
}
