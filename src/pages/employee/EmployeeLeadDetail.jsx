import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { employeeLeadService } from '../../services/employeeLeadService';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Select,
  Textarea,
} from '../../components/admin';

/* ─── Constants ─────────────────────────────────────────────────────────── */

// Status options surfaced to employees. Order = typical lifecycle
// progression to give the UI a natural reading direction.
// `payment_completed` and `lost` are intentionally excluded - they are
// out of scope for this module per product decision (paid leads finish
// outside the follow-up pipeline; lost has been deprecated as an
// outcome). Use 'converted' for successful close, 'closed' for any other
// final state.
const STATUS_OPTIONS = [
  { value: 'new',                label: 'New' },
  { value: 'contacted',          label: 'Contacted' },
  { value: 'followup_scheduled', label: 'Follow-up scheduled' },
  { value: 'interested',         label: 'Interested' },
  { value: 'payment_pending',    label: 'Payment pending' },
  { value: 'converted',          label: 'Converted' },
  { value: 'not_interested',     label: 'Not interested' },
  { value: 'call_back_later',    label: 'Call back later' },
  { value: 'invalid_number',     label: 'Invalid number' },
  { value: 'no_response',        label: 'No response' },
  { value: 'closed',             label: 'Closed' },
];

// Note 'kind' presets for the Add Note form. metadata.kind is free-form
// on the backend; these chips are just UI sugar.
const NOTE_KINDS = [
  { value: 'note',     label: 'Note' },
  { value: 'call',     label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email',    label: 'Email' },
];

const STATUS_BADGE_VARIANT = {
  new:                'info',
  contacted:          'info',
  followup_scheduled: 'warning',
  interested:         'success',
  not_interested:     'neutral',
  payment_pending:    'warning',
  payment_completed:  'success',
  converted:          'success',
  lost:               'danger',
  closed:             'neutral',
  call_back_later:    'warning',
  invalid_number:     'danger',
  no_response:        'warning',
  followup_closed:    'neutral',
};

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const inr = (paise) =>
  paise == null ? '—' : `₹${Number(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function formatDateTime(value) {
  if (!value) return '—';
  try { return new Date(value).toLocaleString(); } catch { return '—'; }
}

// Convert a Date to the value/format the native <input type="datetime-local">
// expects — i.e. `YYYY-MM-DDTHH:mm` in the local timezone (no Z suffix).
// Returns '' for nullish input.
function toLocalDateTimeInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function EmployeeLeadDetail() {
  const { id: enrollmentId } = useParams();
  const navigate = useNavigate();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    employeeLeadService.detail(enrollmentId)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e)  => { if (!cancelled) setError(e); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [enrollmentId, reloadKey]);

  const enrollment = data?.enrollment ?? null;
  const followup   = data?.followup   ?? null;

  // The status select shows the current followup's status (or 'new' when
  // there's no followup yet — first-touch default).
  const currentStatus = followup?.status || 'new';

  // ── Add note form state ─────────────────────────────────────────────
  const [noteBody, setNoteBody] = useState('');
  const [noteKind, setNoteKind] = useState('note');
  const [addingNote, setAddingNote] = useState(false);

  const submitNote = async (e) => {
    e?.preventDefault?.();
    const body = noteBody.trim();
    if (!body) {
      toast.error('Note cannot be empty');
      return;
    }
    setAddingNote(true);
    try {
      await employeeLeadService.addNote(enrollmentId, {
        body,
        metadata: { kind: noteKind },
      });
      toast.success('Note added');
      setNoteBody('');
      refetch();
    } catch (err) {
      toast.error(err?.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  // ── Status / schedule form state ────────────────────────────────────
  // Initialised from the loaded followup. Resets when the followup updates.
  const [statusDraft, setStatusDraft]   = useState(currentStatus);
  const [scheduleDraft, setScheduleDraft] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    setStatusDraft(currentStatus);
    setScheduleDraft(toLocalDateTimeInput(followup?.next_followup_date));
  }, [currentStatus, followup?.next_followup_date]);

  const submitStatus = async (e) => {
    e?.preventDefault?.();
    // Convert local datetime-input back to an ISO string. Empty = clear.
    const nextFollowupDate = scheduleDraft
      ? new Date(scheduleDraft).toISOString()
      : null;
    setSavingStatus(true);
    try {
      await employeeLeadService.updateStatus(enrollmentId, {
        status:           statusDraft,
        nextFollowupDate,
      });
      toast.success('Lead updated');
      refetch();
    } catch (err) {
      toast.error(err?.message || 'Failed to update lead');
    } finally {
      setSavingStatus(false);
    }
  };

  // ── Timeline construction ───────────────────────────────────────────
  // Merge notes + the followup creation event into one chronologically
  // sorted list. Future: payment events could plug in here too.
  const timelineEntries = useMemo(() => {
    if (!followup) return [];
    const notes = (followup.notes || []).map((n) => ({
      id:        `note-${n.id}`,
      kind:      n.metadata?.kind || (n.metadata?.kind === undefined ? 'note' : 'system'),
      body:      n.body,
      authorEmail: n.author?.email || null,
      createdAt: n.created_at,
      isSystem:  n.metadata?.kind === 'system',
    }));
    const items = [
      ...notes,
      {
        id: 'followup-created',
        kind: 'system',
        body: 'Follow-up record created.',
        authorEmail: null,
        createdAt: followup.created_at,
        isSystem: true,
      },
    ];
    items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return items;
  }, [followup]);

  /* ─── Render ──────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lead" subtitle="Loading…" />
        <Card><div className="py-16 text-center text-slate-500 text-sm">Loading lead…</div></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lead" subtitle="Unable to load lead" />
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error.message || 'Failed to load lead.'}
        </div>
        <div>
          <Link to="/employee/leads" className="text-sm text-emerald-700 hover:underline">
            ← Back to My Leads
          </Link>
        </div>
      </div>
    );
  }

  if (!enrollment) return null;

  const fullName =
    enrollment.name ||
    `${enrollment.first_name || ''} ${enrollment.last_name || ''}`.trim() ||
    '(no name)';
  const plan = enrollment.internal_plan || enrollment.plan_pricing?.plan;
  const planName =
    enrollment.internal_plan?.name ||
    enrollment.plan_pricing?.plan?.name ||
    enrollment.plan ||
    '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        subtitle={enrollment.email || ''}
        action={
          <Button variant="secondary" onClick={() => navigate('/employee/leads')}>
            ← Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: student + lead details (2/3 width on lg) ────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Student card */}
          <Card title="Student">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email</dt>
                <dd className="text-slate-900">{enrollment.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Phone</dt>
                <dd className="text-slate-900">{enrollment.phone_number || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Enrollment code</dt>
                <dd className="font-mono text-[12px] text-slate-700">{enrollment.enrollment_code || enrollment.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Created</dt>
                <dd className="text-slate-700">{formatDateTime(enrollment.created_at)}</dd>
              </div>
            </dl>
          </Card>

          {/* Plan + financials */}
          <Card title="Plan & Payment">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Plan</dt>
                <dd className="text-slate-900">{planName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Lifecycle status</dt>
                <dd>
                  <Badge variant="neutral">{enrollment.status || '—'}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Amount</dt>
                <dd className="text-slate-900">{inr(enrollment.final_amount_paise ?? enrollment.amount)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Amount paid</dt>
                <dd className="text-slate-900">{inr(enrollment.amount_paid_paise)}</dd>
              </div>
            </dl>

            {Array.isArray(enrollment.payments) && enrollment.payments.length > 0 && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Recent payments</div>
                <ul className="space-y-1.5 text-xs">
                  {enrollment.payments.slice(0, 5).map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-1">
                      <span className="text-slate-500">{formatDateTime(p.created_at)}</span>
                      <span className="font-mono text-[11px] text-slate-500 truncate">
                        {p.razorpay_payment_id || p.razorpay_order_id || '—'}
                      </span>
                      <span className="text-slate-900 font-medium">{inr(p.amount)}</span>
                      <Badge variant={p.status === 'success' ? 'success' : p.status === 'failed' ? 'danger' : 'neutral'}>
                        {p.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Activity / timeline */}
          <Card title="Activity">
            {timelineEntries.length === 0 ? (
              <div className="text-sm text-slate-400 italic py-2">
                No activity yet. Add the first note below to start working this lead.
              </div>
            ) : (
              <ol className="space-y-3">
                {timelineEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className={`rounded-lg border p-3 ${
                      entry.isSystem
                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={entry.isSystem ? 'neutral' : 'info'}>
                          {entry.kind || 'note'}
                        </Badge>
                        {entry.authorEmail && (
                          <span className="text-[11px] text-slate-500">{entry.authorEmail}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{formatDateTime(entry.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{entry.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* ── RIGHT: action panel (1/3 width on lg) ────────────────── */}
        <div className="space-y-6">

          {/* Status + schedule */}
          <Card title="Status & Schedule">
            <form onSubmit={submitStatus} className="space-y-4">
              <Select
                label="Status"
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
              <Input
                label="Next follow-up"
                type="datetime-local"
                value={scheduleDraft}
                onChange={(e) => setScheduleDraft(e.target.value)}
                hint="Leave blank to clear the schedule."
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Current:&nbsp;
                  <Badge variant={STATUS_BADGE_VARIANT[currentStatus] ?? 'neutral'}>
                    {currentStatus.replace(/_/g, ' ')}
                  </Badge>
                </span>
                <Button type="submit" variant="primary" loading={savingStatus}>
                  Save
                </Button>
              </div>
            </form>
          </Card>

          {/* Add note */}
          <Card title="Add Note">
            <form onSubmit={submitNote} className="space-y-3">
              <Select
                label="Type"
                value={noteKind}
                onChange={(e) => setNoteKind(e.target.value)}
              >
                {NOTE_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </Select>
              <Textarea
                label="Note"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={4}
                placeholder="What happened on this contact attempt?"
                maxLength={5000}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{noteBody.length}/5000</span>
                <Button type="submit" variant="primary" loading={addingNote} disabled={!noteBody.trim()}>
                  Add note
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
