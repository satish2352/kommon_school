import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { courseNameService } from '../../services/courseNameService';
import {
  PageHeader,
  Card,
  Button,
  IconButton,
  Input,
  Select,
  Textarea,
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

const EMPTY_FORM = {
  name:        '',
  description: '',
  status:      'ACTIVE',
};

function validateForm(f) {
  const e = {};
  if (!f.name.trim()) {
    e.name = 'Course name is required';
  } else if (f.name.trim().length < 2) {
    e.name = 'Course name must be at least 2 characters';
  } else if (f.name.trim().length > 100) {
    e.name = 'Course name must be at most 100 characters';
  }
  if (f.description && f.description.length > 500) {
    e.description = 'Description must be at most 500 characters';
  }
  return e;
}

/* ─── Column count ───────────────────────────────────────────────────────── */
const COL_COUNT = 5;

/* ─── Icon constants ─────────────────────────────────────────────────────── */
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
export default function CourseNames() {
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
  const [statusFilter, setStatusFilter] = useState('ALL');

  /* ── Modal / form state ── */
  const [modalOpen, setModalOpen]   = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);

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
    courseNameService
      .list({ page, limit, search, status: statusFilter })
      .then(({ records: rows, meta: m }) => {
        if (!cancelled) { setRecords(rows); setMeta(m); }
      })
      .catch((err) => { if (!cancelled) setError(err.message ?? 'Failed to load course names'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, limit, search, statusFilter, refreshKey]);

  /* ── Handlers ── */
  const handleSearchChange = (v) => { setSearchInput(v); };
  const handleStatus       = (v) => { setStatusFilter(v); setPage(1); };
  const handleLimit        = (v) => { setLimit(Number(v)); setPage(1); };
  const resetFilters       = () => { setSearchInput(''); setSearch(''); setStatusFilter('ALL'); setPage(1); };
  // Reset is only meaningful when a filter is actually applied.
  const filtersActive      = searchInput.trim() !== '' || statusFilter !== 'ALL';

  const openAdd = () => {
    setEditRecord(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (rec) => {
    setEditRecord(rec);
    setForm({
      name:        rec.name ?? '',
      description: rec.description ?? '',
      status:      rec.status ?? 'ACTIVE',
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
        name:        form.name.trim(),
        description: form.description.trim() || null,
        status:      form.status,
      };
      if (editRecord) {
        await courseNameService.update(editRecord.id, payload);
        toast.success('Course name updated');
      } else {
        await courseNameService.create(payload);
        toast.success('Course name created');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      if (err?.code === 'COURSE_NAME_EXISTS') {
        toast.error('A course name with this value already exists.');
      } else if (err?.code === 'SYSTEM_DEFAULT_LOCKED') {
        toast.error('This record is a system default and cannot be modified.');
      } else {
        toast.error(err.message ?? 'Failed to save course name');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (rec) => {
    if (rec.isSystemDefault) return;
    const newStatus = rec.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await courseNameService.update(rec.id, { status: newStatus });
      toast.success(newStatus === 'ACTIVE' ? 'Course name activated' : 'Course name deactivated');
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
      await courseNameService.remove(deleteTarget.id);
      toast.success('Course name deleted');
      setDeleteTarget(null);
      if (records.length === 1 && page > 1) setPage((p) => p - 1);
      else refresh();
    } catch (err) {
      if (err?.code === 'COURSE_NAME_IN_USE') {
        toast.error('Cannot delete: this name is still used by one or more course offerings.');
      } else if (err?.code === 'SYSTEM_DEFAULT_LOCKED') {
        toast.error('This record is a system default and cannot be modified.');
      } else {
        toast.error(err.message ?? 'Failed to delete course name');
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
        title="Course Names"
        subtitle="Manage the normalized course name lookup table"
        action={
          <Button variant="primary" onClick={openAdd}>
            Add Course Name
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
            placeholder="Search by name..."
            className="w-64"
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
          <Button variant="secondary" onClick={resetFilters} disabled={!filtersActive}>Reset</Button>
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
              {['Sr No', 'Name', 'Used in Courses', 'Status', 'Actions'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={COL_COUNT}>
                  <PageLoader label="Loading course names…" minH="min-h-[200px]" />
                </td>
              </tr>
            )}

            {!loading && !error && records.length === 0 && (
              <EmptyState
                colSpan={COL_COUNT}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                }
                title={!!search || statusFilter !== 'ALL' ? 'No course names match your filters' : 'No course names yet'}
                description={!!search || statusFilter !== 'ALL' ? 'Try adjusting your search or filter.' : 'Add your first course name with the button above.'}
              />
            )}

            {!loading && !error && records.map((rec, idx) => {
              const isLocked = !!rec.isSystemDefault;
              return (
                <Tr key={rec.id} striped={idx % 2 === 1}>
                  <Td className="text-slate-500 text-sm font-mono">
                    {(meta.page - 1) * meta.limit + idx + 1}
                  </Td>
                  <Td className="text-slate-900 font-medium max-w-xs">
                    {rec.name}
                    {isLocked && (
                      <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 ml-1.5 align-middle">
                        System
                      </span>
                    )}
                  </Td>
                  <Td className="text-slate-600 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold">
                      {rec.courseCount ?? 0}
                    </span>
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
                        icon={EditIcon}
                        variant="default"
                        disabled={isLocked}
                        title={isLocked ? 'System default — cannot be modified' : 'Edit course name'}
                        onClick={() => { if (isLocked) return; openEdit(rec); }}
                      />
                      <IconButton
                        icon={DeleteIcon}
                        variant="danger"
                        disabled={isLocked || (rec.courseCount ?? 0) > 0}
                        title={
                          isLocked
                            ? 'System default — cannot be deleted'
                            : (rec.courseCount ?? 0) > 0
                              ? `In use by ${rec.courseCount} course offering(s)`
                              : 'Delete course name'
                        }
                        onClick={() => { if (isLocked || (rec.courseCount ?? 0) > 0) return; setDeleteTarget(rec); }}
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
        title={editRecord ? 'Edit Course Name' : 'Add Course Name'}
        widthClass="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {saving ? 'Saving...' : editRecord ? 'Update' : 'Add Course Name'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Course Name"
            required
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            placeholder="e.g. Full Stack Development Using Python"
            maxLength={100}
            showCount
            error={formErrors.name}
          />

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setField('status', e.target.value)}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>

          <Textarea
            label="Description (Optional)"
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            placeholder="Brief description (optional)"
            maxLength={500}
            showCount
            error={formErrors.description}
          />
        </div>
      </Modal>

      {/* ── Delete confirm modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete course name?"
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
          ? This cannot be undone. Course names in use by course offerings cannot be deleted.
        </p>
      </Modal>
    </div>
  );
}
