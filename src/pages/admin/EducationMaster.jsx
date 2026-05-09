import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { educationMasterService } from '../../services/educationMasterService';
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

const EMPTY_FORM = {
  name:        '',
  code:        '',
  description: '',
  status:      'ACTIVE',
};

function validateForm(f) {
  const e = {};
  if (!f.name.trim()) {
    e.name = 'Name is required';
  } else if (f.name.trim().length < 2) {
    e.name = 'Name must be at least 2 characters';
  } else if (f.name.trim().length > 100) {
    e.name = 'Name must be at most 100 characters';
  }
  if (!f.code.trim()) {
    e.code = 'Code is required';
  } else if (f.code.trim().length < 2) {
    e.code = 'Code must be at least 2 characters';
  } else if (f.code.trim().length > 50) {
    e.code = 'Code must be at most 50 characters';
  } else if (!/^[A-Z0-9_]+$/.test(f.code.trim().toUpperCase())) {
    e.code = 'Code must be uppercase letters, digits, and underscores only';
  }
  if (f.description && f.description.length > 500) {
    e.description = 'Description must be at most 500 characters';
  }
  return e;
}

/* ─── Skeleton rows ──────────────────────────────────────────────────────── */
const COL_COUNT = 5;

function SkeletonRows({ count = 7 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Tr key={i} striped={i % 2 === 1}>
          <Td><Skeleton w="w-32" /></Td>
          <Td><Skeleton w="w-24" /></Td>
          <Td><Skeleton w="w-48" /></Td>
          <Td><Skeleton w="w-14" /></Td>
          <Td><Skeleton w="w-16" /></Td>
        </Tr>
      ))}
    </>
  );
}

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
export default function EducationMaster() {
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
    educationMasterService
      .list({ page, limit, search, status: statusFilter })
      .then(({ records: rows, meta: m }) => {
        if (!cancelled) { setRecords(rows); setMeta(m); }
      })
      .catch((err) => { if (!cancelled) setError(err.message ?? 'Failed to load records'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, limit, search, statusFilter, refreshKey]);

  /* ── Handlers ── */
  const handleSearchChange = (v) => { setSearchInput(v); };
  const handleStatus       = (v) => { setStatusFilter(v); setPage(1); };
  const handleLimit        = (v) => { setLimit(Number(v)); setPage(1); };

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
      code:        rec.code ?? '',
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
        code:        form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        status:      form.status,
      };
      if (editRecord) {
        await educationMasterService.update(editRecord.id, payload);
        toast.success('Education record updated');
      } else {
        await educationMasterService.create(payload);
        toast.success('Education record created');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      if (err?.code === 'SYSTEM_DEFAULT_LOCKED') {
        toast.error('This record is a system default and cannot be modified.');
      } else {
        toast.error(err.message ?? 'Failed to save record');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (rec) => {
    if (rec.isSystemDefault) return;
    const newStatus = rec.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await educationMasterService.update(rec.id, { status: newStatus });
      toast.success(newStatus === 'ACTIVE' ? 'Record activated' : 'Record deactivated');
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
      await educationMasterService.remove(deleteTarget.id);
      toast.success('Education record deleted');
      setDeleteTarget(null);
      if (records.length === 1 && page > 1) setPage((p) => p - 1);
      else refresh();
    } catch (err) {
      if (err?.code === 'SYSTEM_DEFAULT_LOCKED') {
        toast.error('This record is a system default and cannot be modified.');
      } else {
        toast.error(err.message ?? 'Failed to delete record');
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
        title="Education Master"
        subtitle="Manage education level lookup values"
        action={
          <Button variant="primary" onClick={openAdd}>
            Add Education
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
            placeholder="Search by name or code..."
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
              {['Name', 'Code', 'Description', 'Status', 'Actions'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <SkeletonRows />}

            {!loading && !error && records.length === 0 && (
              <EmptyState
                colSpan={COL_COUNT}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                }
                title={!!search || statusFilter !== 'ALL' ? 'No education records match your filters' : 'No education records yet'}
                description={!!search || statusFilter !== 'ALL' ? 'Try adjusting your search or filter.' : 'Add your first record with the button above.'}
              />
            )}

            {!loading && !error && records.map((rec, idx) => {
              const isLocked = !!rec.isSystemDefault;
              return (
                <Tr key={rec.id} striped={idx % 2 === 1}>
                  <Td className="text-slate-900 font-medium">
                    {rec.name}
                    {isLocked && (
                      <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 ml-1.5 align-middle">
                        System
                      </span>
                    )}
                  </Td>
                  <Td className="font-mono text-xs text-slate-600">
                    {rec.code}
                  </Td>
                  <Td className="text-slate-600 max-w-xs truncate">
                    {rec.description ?? <span className="text-slate-300">—</span>}
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
                        title={isLocked ? 'System default — cannot be modified' : 'Edit record'}
                        onClick={() => { if (isLocked) return; openEdit(rec); }}
                      />
                      <IconButton
                        icon={DeleteIcon}
                        variant="danger"
                        disabled={isLocked}
                        title={isLocked ? 'System default — cannot be modified' : 'Delete record'}
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

      {/* ── Add / Edit modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editRecord ? 'Edit Education' : 'Add Education'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {saving ? 'Saving...' : editRecord ? 'Update' : 'Add Education'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            required
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            placeholder="e.g. Graduate"
            error={formErrors.name}
          />

          <Input
            label="Code"
            required
            type="text"
            value={form.code}
            onChange={(e) => setField('code', e.target.value.toUpperCase())}
            onBlur={() => handleBlur('code')}
            placeholder="e.g. GRADUATE"
            error={formErrors.code}
            hint="Uppercase letters, digits, and underscores only"
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
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            placeholder="Optional description (max 500 chars)"
            error={formErrors.description}
          />
        </div>
      </Modal>

      {/* ── Delete confirm modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete education record?"
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
          ? This cannot be undone. Records in use by courses cannot be deleted.
        </p>
      </Modal>
    </div>
  );
}
