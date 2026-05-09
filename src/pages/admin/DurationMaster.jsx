import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { durationMasterService } from '../../services/durationMasterService';
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
} from '../../components/admin';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const EMPTY_FORM = {
  label:     '',
  sortOrder: '0',
  status:    'ACTIVE',
};

function validateForm(f) {
  const e = {};
  if (!f.label.trim()) {
    e.label = 'Label is required';
  } else if (f.label.trim().length < 1) {
    e.label = 'Label must be at least 1 character';
  } else if (f.label.trim().length > 50) {
    e.label = 'Label must be at most 50 characters';
  }
  const so = Number(f.sortOrder);
  if (f.sortOrder !== '' && (isNaN(so) || !Number.isInteger(so) || so < 0 || so > 9999)) {
    e.sortOrder = 'Sort order must be an integer between 0 and 9999';
  }
  return e;
}

/* ─── Skeleton rows ──────────────────────────────────────────────────────── */
const COL_COUNT = 4;

function SkeletonRows({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Tr key={i} striped={i % 2 === 1}>
          <Td><Skeleton w="w-24" /></Td>
          <Td><Skeleton w="w-16" /></Td>
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
export default function DurationMaster() {
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
    durationMasterService
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
      label:     rec.label ?? '',
      sortOrder: String(rec.sortOrder ?? 0),
      status:    rec.status ?? 'ACTIVE',
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
        label:     form.label.trim(),
        sortOrder: form.sortOrder !== '' ? Number(form.sortOrder) : 0,
        status:    form.status,
      };
      if (editRecord) {
        await durationMasterService.update(editRecord.id, payload);
        toast.success('Duration record updated');
      } else {
        await durationMasterService.create(payload);
        toast.success('Duration record created');
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
      await durationMasterService.update(rec.id, { status: newStatus });
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
      await durationMasterService.remove(deleteTarget.id);
      toast.success('Duration record deleted');
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
        title="Duration Master"
        subtitle="Manage course duration lookup values"
        action={
          <Button variant="primary" onClick={openAdd}>
            Add Duration
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
            placeholder="Search by label..."
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
              {['Label', 'Sort Order', 'Status', 'Actions'].map((h) => (
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title={!!search || statusFilter !== 'ALL' ? 'No duration records match your filters' : 'No duration records yet'}
                description={!!search || statusFilter !== 'ALL' ? 'Try adjusting your search or filter.' : 'Add your first record with the button above.'}
              />
            )}

            {!loading && !error && records.map((rec, idx) => {
              const isLocked = !!rec.isSystemDefault;
              return (
                <Tr key={rec.id} striped={idx % 2 === 1}>
                  <Td className="text-slate-900 font-medium">
                    {rec.label}
                    {isLocked && (
                      <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 ml-1.5 align-middle">
                        System
                      </span>
                    )}
                  </Td>
                  <Td className="text-slate-600">
                    {rec.sortOrder}
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
        title={editRecord ? 'Edit Duration' : 'Add Duration'}
        widthClass="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {saving ? 'Saving...' : editRecord ? 'Update' : 'Add Duration'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Label"
            required
            type="text"
            value={form.label}
            onChange={(e) => setField('label', e.target.value)}
            onBlur={() => handleBlur('label')}
            placeholder="e.g. 6 Months"
            error={formErrors.label}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sort Order"
              type="number"
              min="0"
              max="9999"
              step="1"
              value={form.sortOrder}
              onChange={(e) => setField('sortOrder', e.target.value)}
              onBlur={() => handleBlur('sortOrder')}
              placeholder="0"
              error={formErrors.sortOrder}
            />

            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* ── Delete confirm modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete duration record?"
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
            &ldquo;{deleteTarget?.label}&rdquo;
          </span>
          ? This cannot be undone. Records in use by courses cannot be deleted.
        </p>
      </Modal>
    </div>
  );
}
