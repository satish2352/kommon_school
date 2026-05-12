import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { internalPlansService } from '../../services/internalPlansService';
import { courseService } from '../../services/courseService';
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
  Skeleton,
  EmptyState,
  Badge,
} from '../../components/admin';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const DURATION_LABELS = {
  '1_MONTH':   '1 Month',
  '3_MONTHS':  '3 Months',
  '6_MONTHS':  '6 Months',
  '12_MONTHS': '12 Months',
};

const formatFee = (fee) =>
  fee != null
    ? `₹${Number(fee).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '—';

/* ─── Skeleton rows ──────────────────────────────────────────────────────── */
const COL_COUNT = 8;

function SkeletonRows({ count = 7 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Tr key={i} striped={i % 2 === 1}>
          <Td><Skeleton w="w-48" /></Td>
          <Td><Skeleton w="w-32" /></Td>
          <Td><Skeleton w="w-24" /></Td>
          <Td><Skeleton w="w-20" /></Td>
          <Td><Skeleton w="w-24" /></Td>
          <Td><Skeleton w="w-16" /></Td>
          <Td><Skeleton w="w-14" /></Td>
          <Td><Skeleton w="w-16" /></Td>
        </Tr>
      ))}
    </>
  );
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const EditIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const DeleteIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

/* ─── Main page component ────────────────────────────────────────────────── */
export default function InternalPlans() {
  const navigate = useNavigate();

  /* ── List state ── */
  const [plans, setPlans]           = useState([]);
  const [meta, setMeta]             = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /* ── Filter state ── */
  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('');

  /* ── Course options for filter dropdown ── */
  const [courseOptions, setCourseOptions] = useState([]);

  /* ── Delete confirm state ── */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  /* ── Load course list once ── */
  useEffect(() => {
    courseService.list({ limit: 100, status: 'ACTIVE' })
      .then(({ courses }) => setCourseOptions(courses ?? []))
      .catch(() => {});
  }, []);

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
    internalPlansService
      .list({
        page,
        limit,
        search,
        status:   statusFilter,
        courseId: courseFilter || undefined,
      })
      .then(({ data: rows, meta: m }) => {
        if (!cancelled) { setPlans(rows); setMeta(m); }
      })
      .catch((err) => { if (!cancelled) setError(err.message ?? 'Failed to load internal plans'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, limit, search, statusFilter, courseFilter, refreshKey]);

  /* ── Handlers ── */
  const handleStatus   = (v) => { setStatusFilter(v); setPage(1); };
  const handleCourse   = (v) => { setCourseFilter(v); setPage(1); };
  const handleLimit    = (v) => { setLimit(Number(v)); setPage(1); };

  const handleToggleStatus = async (plan) => {
    const newStatus = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await internalPlansService.setStatus(plan.id, newStatus);
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
      await internalPlansService.remove(deleteTarget.id);
      toast.success('Internal plan deleted');
      setDeleteTarget(null);
      if (plans.length === 1 && page > 1) setPage((p) => p - 1);
      else refresh();
    } catch (err) {
      if (err?.code === 'PLAN_IN_USE') {
        toast.error('Cannot delete a plan that has active enrollments.');
      } else {
        toast.error(err.message ?? 'Failed to delete plan');
      }
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <PageHeader
        title="Internal Plans"
        subtitle="Manage course-specific internal subscription plans"
        action={
          <Button variant="primary" onClick={() => navigate('/admin/internal-plans/new')}>
            Add Internal Plan
          </Button>
        }
      />

      {/* ── Filter bar ── */}
      <Card>
        <div className="flex flex-wrap gap-3">
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search plans..."
            className="w-56"
          />
          <Select
            value={courseFilter}
            onChange={(e) => handleCourse(e.target.value)}
            className="w-auto"
          >
            <option value="">All courses</option>
            {courseOptions.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.nameOfCourseAsGroup}</option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => handleStatus(e.target.value)}
            className="w-auto"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </Card>

      {/* ── Error state ── */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Table ── */}
      <Card variant="flush">
        <Table>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Plan Name', 'Ref ID', 'Course', 'Duration', 'Price', 'Coupons', 'Status', 'Actions'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <SkeletonRows />}

            {!loading && !error && plans.length === 0 && (
              <EmptyState
                colSpan={COL_COUNT}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title={!!search || statusFilter !== 'ALL' || courseFilter ? 'No plans match your filters' : 'No internal plans yet'}
                description={!!search || statusFilter !== 'ALL' || courseFilter ? 'Try adjusting your filters.' : 'Add your first internal plan with the button above.'}
              />
            )}

            {!loading && !error && plans.map((p, idx) => {
              const linkedCourse = courseOptions.find((c) => c.id === p.courseId);
              const courseName = linkedCourse?.nameOfCourseAsGroup ?? `Course #${p.courseId}`;
              const activeCoupons = (p.coupons ?? []).filter((c) => c.status === 'ACTIVE').length;
              return (
                <Tr key={p.id} striped={idx % 2 === 1}>
                  <Td className="text-slate-900 font-medium max-w-xs truncate">
                    {p.name}
                  </Td>
                  <Td>
                    <span
                      className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded select-all"
                      title={p.refId ?? ''}
                    >
                      {p.refId ?? '—'}
                    </span>
                  </Td>
                  <Td className="text-slate-600 text-sm max-w-[160px] truncate">
                    {courseName}
                  </Td>
                  <Td>
                    <Badge variant="info">
                      {DURATION_LABELS[p.duration] ?? p.duration}
                    </Badge>
                  </Td>
                  <Td className="text-slate-900 font-semibold">
                    {formatFee(linkedCourse?.courseFee)}
                  </Td>
                  <Td className="text-slate-600 text-sm">
                    {activeCoupons > 0 ? (
                      <Badge variant="success">{activeCoupons} active</Badge>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </Td>
                  <Td>
                    <StatusToggle
                      status={p.status}
                      onToggle={() => handleToggleStatus(p)}
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <IconButton
                        icon={EditIcon}
                        variant="default"
                        title="Edit plan"
                        onClick={() => navigate(`/admin/internal-plans/${p.id}`)}
                      />
                      <IconButton
                        icon={DeleteIcon}
                        variant="danger"
                        title="Delete plan"
                        onClick={() => setDeleteTarget(p)}
                      />
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {/* ── Pagination ── */}
      <Pagination
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={handleLimit}
      />

      {/* ── Delete confirm modal ── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete internal plan?"
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
          Delete{' '}
          <span className="font-medium text-slate-900">
            &ldquo;{deleteTarget?.name}&rdquo;
          </span>
          ? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
