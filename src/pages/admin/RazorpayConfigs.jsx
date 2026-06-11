import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { razorpayConfigService } from '../../services/razorpayConfigService';
import { useAuth } from '../../hooks/useAuth';
import {
  PageHeader,
  Card,
  Button,
  IconButton,
  Input,
  Modal,
  Badge,
  Table,
  Th,
  Td,
  Tr,
  PageLoader,
  EmptyState,
} from '../../components/admin';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const COL_COUNT = 5;

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const EMPTY_FORM = { key_id: '', key_secret: '', webhook_secret: '' };

// Mirror backend Joi: each field min 5, max 255, required.
function validateForm(form) {
  const e = {};
  const check = (key, label) => {
    const v = (form[key] ?? '').trim();
    if (!v) e[key] = `${label} is required`;
    else if (v.length < 5) e[key] = `${label} must be at least 5 characters`;
    else if (v.length > 255) e[key] = `${label} must be at most 255 characters`;
  };
  check('key_id', 'Key ID');
  check('key_secret', 'Key Secret');
  check('webhook_secret', 'Webhook Secret');
  return e;
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const DeleteIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);


/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function RazorpayConfigs() {
  const { user } = useAuth();
  const isSuperAdmin = String(user?.role ?? '').toLowerCase() === 'superadmin';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [showAdd, setShowAdd]       = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);

  const [activatingId, setActivatingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    razorpayConfigService
      .list()
      .then((rows) => setRecords(Array.isArray(rows) ? rows : []))
      .catch((err) => setError(err.message ?? 'Failed to load configurations'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isSuperAdmin) load();
    else setLoading(false);
  }, [isSuperAdmin, load]);

  /* ── Create ── */
  const openAdd = () => { setForm(EMPTY_FORM); setFormErrors({}); setShowAdd(true); };

  const handleCreate = async () => {
    const e = validateForm(form);
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setFormErrors({});
    setSaving(true);
    try {
      await razorpayConfigService.create({
        key_id:         form.key_id.trim(),
        key_secret:     form.key_secret.trim(),
        webhook_secret: form.webhook_secret.trim(),
      });
      toast.success('Razorpay key added (inactive). Activate it to go live.');
      setShowAdd(false);
      load();
    } catch (err) {
      toast.error(err.message ?? 'Failed to add key');
    } finally {
      setSaving(false);
    }
  };

  /* ── Activate ── */
  const handleActivate = async (rec) => {
    setActivatingId(rec.id);
    try {
      await razorpayConfigService.activate(rec.id);
      toast.success(`Activated ${rec.key_id}`);
      load();
    } catch (err) {
      toast.error(err.message ?? 'Failed to activate key');
    } finally {
      setActivatingId(null);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await razorpayConfigService.remove(deleteTarget.id);
      toast.success('Key deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.message ?? 'Failed to delete key');
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Access guard ───────────────────────────────────────────────────── */
  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Razorpay Configurations" subtitle="Payment gateway keys" />
        <Card>
          <div className="py-12 text-center">
            <h2 className="text-base font-semibold text-slate-800 mb-1">Access restricted</h2>
            <p className="text-sm text-slate-500">
              Only a <span className="font-medium">superadmin</span> can view or manage Razorpay keys.
              Your role ({user?.role ?? 'unknown'}) doesn’t have access.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <PageHeader
        title="Razorpay Configurations"
        subtitle="Manage payment gateway API keys — one key is active at a time"
        action={
          <Button variant="primary" onClick={openAdd}>
            + Add Key
          </Button>
        }
      />

      {/* Info banner */}
      <div className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Secrets are encrypted at rest and never shown again after saving. Add a new key, then
          <span className="font-medium"> Activate</span> it to make it live — activating one automatically
          deactivates the others. The active key cannot be deleted (activate another first).
        </span>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Card variant="flush">
        <Table>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Sr No', 'Key ID', 'Status', 'Created', 'Actions'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={COL_COUNT}>
                  <PageLoader label="Loading configurations…" minH="min-h-[200px]" />
                </td>
              </tr>
            )}

            {!loading && !error && records.length === 0 && (
              <EmptyState
                colSpan={COL_COUNT}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                }
                title="No Razorpay keys yet"
                description="Add your first gateway key with the button above, then activate it."
              />
            )}

            {!loading && !error && records.map((rec, idx) => {
              const isActive = !!rec.is_active;
              return (
                <Tr key={rec.id} striped={idx % 2 === 1}>
                  <Td className="text-slate-500 text-sm font-mono">{idx + 1}</Td>
                  <Td className="font-mono text-xs text-slate-700">{rec.key_id}</Td>
                  <Td>
                    <Badge variant={isActive ? 'success' : 'neutral'}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td className="text-slate-500 text-xs whitespace-nowrap">{formatDateTime(rec.created_at)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <span className="text-xs text-emerald-600 font-medium">In use</span>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => handleActivate(rec)}
                          loading={activatingId === rec.id}
                          disabled={activatingId === rec.id}
                        >
                          Activate
                        </Button>
                      )}
                      <IconButton
                        icon={DeleteIcon}
                        variant="danger"
                        disabled={isActive}
                        title={isActive ? 'Active key cannot be deleted — activate another first' : 'Delete key'}
                        onClick={() => { if (!isActive) setDeleteTarget(rec); }}
                      />
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {/* ── Add key modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={showAdd}
        onClose={() => !saving && setShowAdd(false)}
        title="Add Razorpay Key"
        widthClass="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdd(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={handleCreate}>
              {saving ? 'Saving...' : 'Add Key'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Key ID"
            required
            type="text"
            value={form.key_id}
            onChange={(e) => setForm((p) => ({ ...p, key_id: e.target.value }))}
            placeholder="e.g. rzp_test_XXXXXXXXXXXXXX"
            autoComplete="off"
            error={formErrors.key_id}
          />
          <Input
            label="Key Secret"
            required
            type="password"
            value={form.key_secret}
            onChange={(e) => setForm((p) => ({ ...p, key_secret: e.target.value }))}
            placeholder="Razorpay API key secret"
            autoComplete="new-password"
            hint="Encrypted at rest — you won’t be able to view it again after saving."
            error={formErrors.key_secret}
          />
          <Input
            label="Webhook Secret"
            required
            type="password"
            value={form.webhook_secret}
            onChange={(e) => setForm((p) => ({ ...p, webhook_secret: e.target.value }))}
            placeholder="Razorpay webhook signing secret"
            autoComplete="new-password"
            hint="Used to verify incoming Razorpay webhook signatures."
            error={formErrors.webhook_secret}
          />
          <p className="text-xs text-slate-400">
            The key is added as <span className="font-medium">inactive</span>. Activate it from the list to go live.
          </p>
        </div>
      </Modal>

      {/* ── Delete confirm modal ────────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Razorpay key?"
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
          Delete key{' '}
          <span className="font-mono text-slate-900">{deleteTarget?.key_id}</span>?
          This permanently removes the stored credentials and cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
