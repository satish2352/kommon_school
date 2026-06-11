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
  PageLoader,
  EmptyState,
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

const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

/* ─── Read-only detail field (used by the view modal) ─────────────────────── */
// `optional` renders a small "Optional" tag next to the label so admins can
// tell at a glance which fields are non-compulsory.
function Detail({ label, optional = false, children }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
        {optional && (
          <span className="normal-case tracking-normal text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
            Optional
          </span>
        )}
      </dt>
      <dd className="mt-1 text-sm text-slate-800 break-words">{children ?? '—'}</dd>
    </div>
  );
}

/* ─── Column count ───────────────────────────────────────────────────────── */
const COL_COUNT = 7;

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const ViewIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.964 7.178.07.207.07.431 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

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

  /* ── View (read-only details) state ── */
  // The list row is shown immediately for a snappy open; the full record
  // (description, plan id, timestamps) is then fetched and merged in.
  const [viewPlan, setViewPlan]       = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const openView = useCallback((row) => {
    setViewPlan(row);
    setViewLoading(true);
    internalPlansService
      .getById(row.id)
      .then((full) => setViewPlan((cur) => (cur && cur.id === row.id ? { ...cur, ...full } : cur)))
      .catch(() => { /* keep the row data we already have */ })
      .finally(() => setViewLoading(false));
  }, []);

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

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setCourseFilter('');
    setStatusFilter('ALL');
    setPage(1);
  };
  // Reset is only meaningful when a filter is actually applied.
  const filtersActive = searchInput.trim() !== '' || courseFilter !== '' || statusFilter !== 'ALL';

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
            {[...courseOptions]
              .sort((a, b) => {
                const n = (a.nameOfCourseAsGroup ?? '').localeCompare(b.nameOfCourseAsGroup ?? '');
                return n !== 0 ? n : (a.duration?.sortOrder ?? 0) - (b.duration?.sortOrder ?? 0);
              })
              .map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nameOfCourseAsGroup}{c.duration?.label ? ` — ${c.duration.label}` : ''}
                </option>
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
          <Button variant="secondary" onClick={resetFilters} disabled={!filtersActive}>Reset</Button>
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
              {['Sr No', 'Plan Name', 'Ref ID', 'Course', 'Price', 'Status', 'Actions'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={COL_COUNT}>
                  <PageLoader label="Loading internal plans…" minH="min-h-[200px]" />
                </td>
              </tr>
            )}

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
              const courseName = linkedCourse
                ? `${linkedCourse.nameOfCourseAsGroup}${linkedCourse.duration?.label ? ` · ${linkedCourse.duration.label}` : ''}`
                : `Course #${p.courseId}`;
              return (
                <Tr key={p.id} striped={idx % 2 === 1}>
                  <Td className="text-slate-500 text-sm font-mono">{(meta.page - 1) * meta.limit + idx + 1}</Td>
                  <Td className="max-w-xs">
                    <button
                      type="button"
                      onClick={() => openView(p)}
                      className="text-left font-medium text-brand-600 hover:text-brand-800 hover:underline truncate"
                      title="View plan details"
                    >
                      {p.name}
                    </button>
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
                  <Td className="text-slate-900 font-semibold">
                    {formatFee(linkedCourse?.courseFee)}
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
                        icon={ViewIcon}
                        variant="default"
                        title="View plan"
                        onClick={() => openView(p)}
                      />
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

      {/* ── View (read-only) plan details modal ──────────────────────────── */}
      <Modal
        isOpen={!!viewPlan}
        onClose={() => setViewPlan(null)}
        title="Internal Plan Details"
        widthClass="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setViewPlan(null)}>
              Close
            </Button>
            {viewPlan && (
              <Button
                variant="primary"
                onClick={() => { const id = viewPlan.id; setViewPlan(null); navigate(`/admin/internal-plans/${id}`); }}
              >
                Edit Plan
              </Button>
            )}
          </>
        }
      >
        {viewPlan && (() => {
          const linkedCourse = courseOptions.find((c) => c.id === viewPlan.courseId);
          const courseName = linkedCourse
            ? `${linkedCourse.nameOfCourseAsGroup}${linkedCourse.duration?.label ? ` · ${linkedCourse.duration.label}` : ''}`
            : `Course #${viewPlan.courseId}`;
          return (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Detail label="Plan Name">{viewPlan.name || '—'}</Detail>
              <Detail label="Status">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    viewPlan.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {viewPlan.status}
                </span>
              </Detail>
              <Detail label="Plan ID">
                <span className="font-mono text-xs">{viewPlan.externalPlanId || '—'}</span>
              </Detail>
              <Detail label="Ref ID">
                <span className="font-mono text-xs">{viewPlan.refId || '—'}</span>
              </Detail>
              <Detail label="Course">{courseName}</Detail>
              <Detail label="Course Fee">{formatFee(linkedCourse?.courseFee)}</Detail>
              <Detail label="Created">{formatDateTime(viewPlan.createdAt)}</Detail>
              <Detail label="Updated">{formatDateTime(viewPlan.updatedAt)}</Detail>
              <div className="sm:col-span-2">
                <Detail label="Description" optional>
                  {viewPlan.description
                    ? viewPlan.description
                    : <span className="text-slate-400">Not set</span>}
                </Detail>
              </div>
              {viewLoading && (
                <div className="sm:col-span-2 text-xs text-slate-400">Loading full details…</div>
              )}
            </dl>
          );
        })()}
      </Modal>
    </div>
  );
}
