import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { courseService } from '../../services/courseService';
import { durationMasterService } from '../../services/durationMasterService';
import {
  PageHeader,
  Card,
  Button,
  IconButton,
  Input,
  Textarea,
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
} from '../../components/admin';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const formatFee = (fee) =>
  fee != null
    ? `₹${Number(fee).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '—';

const EMPTY_FORM = {
  nameOfCourseAsGroup: '',
  coupon: '',
  courseFee: '',
  durationId: '',
  description: '',
  status: 'ACTIVE',
};

function validateForm(f) {
  const e = {};
  if (!f.nameOfCourseAsGroup.trim()) {
    e.nameOfCourseAsGroup = 'Course name is required';
  } else if (f.nameOfCourseAsGroup.trim().length < 2) {
    e.nameOfCourseAsGroup = 'Course name must be at least 2 characters';
  } else if (f.nameOfCourseAsGroup.trim().length > 200) {
    e.nameOfCourseAsGroup = 'Course name must be at most 200 characters';
  }
  if (f.courseFee === '' || f.courseFee === null || f.courseFee === undefined) {
    e.courseFee = 'Course fee is required';
  } else if (isNaN(Number(f.courseFee)) || Number(f.courseFee) < 0) {
    e.courseFee = 'Course fee must be a positive number';
  } else if (Number(f.courseFee) > 9999999.99) {
    e.courseFee = 'Course fee is too large (max ₹9,999,999.99)';
  }
  if (f.coupon && f.coupon.length > 50)      e.coupon      = 'Coupon must be at most 50 characters';
  if (f.description && f.description.length > 2000) e.description = 'Description must be at most 2000 characters';
  return e;
}

/* ─── Skeleton rows ──────────────────────────────────────────────────────── */
const COL_COUNT = 6;

function SkeletonRows({ count = 7 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Tr key={i} striped={i % 2 === 1}>
          <Td><Skeleton w="w-48" /></Td>
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

/* ─── Edit / Delete icons ────────────────────────────────────────────────── */
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
export default function Courses() {
  /* ── List state ── */
  const [courses, setCourses]       = useState([]);
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

  /* ── Modal / form state ── */
  const [modalOpen, setModalOpen]   = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);

  /* ── Delete confirm state ── */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  /* ── Master dropdown data (loaded once on mount) ── */
  const [durationOptions, setDurationOptions]   = useState([]);

  useEffect(() => {
    durationMasterService.listActive().then(setDurationOptions).catch(() => {});
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
    courseService
      .list({ page, limit, search, status: statusFilter })
      .then(({ courses: rows, meta: m }) => {
        if (!cancelled) { setCourses(rows); setMeta(m); }
      })
      .catch((err) => { if (!cancelled) setError(err.message ?? 'Failed to load courses'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, limit, search, statusFilter, refreshKey]);

  /* ── Handlers ── */
  const handleSearchChange = (v) => { setSearchInput(v); };
  const handleStatus       = (v) => { setStatusFilter(v); setPage(1); };
  const handleLimit        = (v) => { setLimit(Number(v)); setPage(1); };

  const openAdd = () => {
    setEditCourse(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (course) => {
    setEditCourse(course);
    setForm({
      nameOfCourseAsGroup: course.nameOfCourseAsGroup ?? '',
      coupon:              course.coupon ?? '',
      courseFee:           course.courseFee != null ? String(Number(course.courseFee)) : '',
      durationId:          course.duration?.id != null ? String(course.duration.id) : '',
      description:         course.description ?? '',
      status:              course.status ?? 'ACTIVE',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleBlur = (key) => {
    const e = validateForm(form);
    if (e[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: e[key] }));
    } else {
      setFormErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const handleSave = async () => {
    const e = validateForm(form);
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setSaving(true);
    try {
      const payload = {
        nameOfCourseAsGroup: form.nameOfCourseAsGroup.trim(),
        courseFee:           Number(form.courseFee),
        ...(form.coupon.trim() ? { coupon: form.coupon.trim().toUpperCase() } : { coupon: null }),
        ...(form.description.trim() ? { description: form.description.trim() } : { description: null }),
        status:      form.status,
        educationId: 1, // dummy: Education column removed from UI; backend/webhook still expect a value
        durationId:  form.durationId  ? Number(form.durationId)  : null,
      };
      if (editCourse) {
        await courseService.update(editCourse.id, payload);
        toast.success('Course updated');
      } else {
        await courseService.create(payload);
        toast.success('Course created');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      if (err?.code === 'SYSTEM_DEFAULT_LOCKED') {
        toast.error('This record is a system default and cannot be modified.');
      } else {
        toast.error(err.message ?? 'Failed to save course');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (course) => {
    if (course.isSystemDefault) return;
    const newStatus = course.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await courseService.update(course.id, { status: newStatus });
      toast.success(newStatus === 'ACTIVE' ? 'Course activated' : 'Course deactivated');
      refresh();
    } catch (err) {
      if (err?.code === 'SYSTEM_DEFAULT_LOCKED') {
        toast.error('This record is a system default and cannot be modified.');
      } else {
        toast.error(err.message ?? 'Failed to update status');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await courseService.remove(deleteTarget.id);
      toast.success('Course deleted');
      setDeleteTarget(null);
      // If we deleted the last item on a non-first page, step back
      if (courses.length === 1 && page > 1) setPage((p) => p - 1);
      else refresh();
    } catch (err) {
      if (err?.code === 'SYSTEM_DEFAULT_LOCKED') {
        toast.error('This record is a system default and cannot be modified.');
      } else {
        toast.error(err.message ?? 'Failed to delete course');
      }
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="Courses"
        subtitle="Manage the course catalog"
        action={
          <Button variant="primary" onClick={openAdd}>
            Add Course
          </Button>
        }
      />

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-wrap gap-3">
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search courses..."
            className="w-56"
          />
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
              {['Course Name', 'Coupon', 'Course Fee', 'Duration', 'Status', 'Actions'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <SkeletonRows />}

            {!loading && !error && courses.length === 0 && (
              <EmptyState
                colSpan={COL_COUNT}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
                title={!!search || statusFilter !== 'ALL' ? 'No courses match your filters' : 'No courses yet'}
                description={!!search || statusFilter !== 'ALL' ? 'Try adjusting your search or filter.' : 'Add your first course with the button above.'}
              />
            )}

            {!loading && !error && courses.map((c, idx) => {
              const isLocked = !!c.isSystemDefault;
              return (
                <Tr key={c.id} striped={idx % 2 === 1}>
                  <Td className="text-slate-900 font-medium max-w-xs truncate">
                    {c.nameOfCourseAsGroup}
                    {isLocked && (
                      <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 ml-1.5 align-middle">
                        System
                      </span>
                    )}
                  </Td>
                  <Td className="font-mono text-xs text-slate-600">
                    {c.coupon ?? '—'}
                  </Td>
                  <Td className="text-slate-900 font-semibold">
                    {formatFee(c.courseFee)}
                  </Td>
                  <Td className="text-slate-600">
                    {c.duration?.label ?? <span className="text-slate-300">—</span>}
                  </Td>
                  <Td>
                    <StatusToggle
                      status={c.status}
                      isLocked={isLocked}
                      onToggle={() => handleToggleStatus(c)}
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <IconButton
                        icon={EditIcon}
                        variant="default"
                        disabled={isLocked}
                        title={isLocked ? 'System default — cannot be modified' : 'Edit course'}
                        onClick={() => { if (isLocked) return; openEdit(c); }}
                      />
                      <IconButton
                        icon={DeleteIcon}
                        variant="danger"
                        disabled={isLocked}
                        title={isLocked ? 'System default — cannot be modified' : 'Delete course'}
                        onClick={() => { if (isLocked) return; setDeleteTarget(c); }}
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

      {/* ── Add / Edit modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editCourse ? 'Edit Course' : 'Add Course'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editCourse ? 'Update Course' : 'Add Course'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Course Name"
            required
            type="text"
            value={form.nameOfCourseAsGroup}
            onChange={(e) => setField('nameOfCourseAsGroup', e.target.value)}
            onBlur={() => handleBlur('nameOfCourseAsGroup')}
            placeholder="e.g. Data Science and AIML"
            error={formErrors.nameOfCourseAsGroup}
          />

          <Input
            label="Course Fee (₹)"
            required
            type="number"
            min="0"
            step="0.01"
            value={form.courseFee}
            onChange={(e) => setField('courseFee', e.target.value)}
            onBlur={() => handleBlur('courseFee')}
            placeholder="e.g. 49999"
            error={formErrors.courseFee}
          />

          <Input
            label="Coupon Code"
            type="text"
            value={form.coupon}
            onChange={(e) => setField('coupon', e.target.value.toUpperCase())}
            onBlur={() => handleBlur('coupon')}
            placeholder="e.g. EARLYBIRD20"
            error={formErrors.coupon}
          />

          <Select
            label="Duration"
            value={form.durationId}
            onChange={(e) => setField('durationId', e.target.value)}
          >
            <option value="">— Select —</option>
            {durationOptions.map((opt) => (
              <option key={opt.id} value={String(opt.id)}>{opt.label}</option>
            ))}
          </Select>

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setField('status', e.target.value)}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>

          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            placeholder="Brief course overview (optional)"
            error={formErrors.description}
          />
        </div>
      </Modal>

      {/* ── Delete confirm modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete course?"
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
            &ldquo;{deleteTarget?.nameOfCourseAsGroup}&rdquo;
          </span>
          ? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
