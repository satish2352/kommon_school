import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { internalPlansService } from '../../services/internalPlansService';
import { courseService } from '../../services/courseService';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Textarea,
  Select,
  SearchableSelect,
} from '../../components/admin';

/* ─── Constants ──────────────────────────────────────────────────────────── */

// The plan's contract `duration` enum (1_MONTH / 3_MONTHS / 6_MONTHS / 12_MONTHS)
// is still required by the Prisma schema, but no longer shown in the form.
// It defaults to 6_MONTHS on create; preserved as-is on edit.
const DEFAULT_PLAN_DURATION = '6_MONTHS';

const EMPTY_FORM = {
  name:        '',
  duration:    DEFAULT_PLAN_DURATION,
  description: '',
  courseId:    '',
  status:      'ACTIVE',
  // Required: external integration Plan ID. Sent as `planId` in the Sumago
  // provision-user webhook. Globally unique across internal plans.
  externalPlanId: '',
};

// Mirrors backend Joi pattern: letters, digits, underscores, hyphens.
const EXTERNAL_PLAN_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

/* ─── Validation ─────────────────────────────────────────────────────────── */

function validateForm(form) {
  const e = {};
  const name = form.name.trim();
  if (!name) {
    e.name = 'Plan name is required';
  } else if (name.length < 2) {
    e.name = 'Plan name must be at least 2 characters';
  } else if (name.length > 200) {
    e.name = 'Plan name must be at most 200 characters';
  }

  if (!form.courseId) {
    e.courseId = 'Course is required';
  }

  if (form.description && form.description.length > 2000) {
    e.description = 'Description must be at most 2000 characters';
  }

  const externalPlanId = (form.externalPlanId || '').trim();
  if (!externalPlanId) {
    e.externalPlanId = 'Plan ID is required';
  } else if (externalPlanId.length > 100) {
    e.externalPlanId = 'Plan ID must be at most 100 characters';
  } else if (!EXTERNAL_PLAN_ID_PATTERN.test(externalPlanId)) {
    e.externalPlanId = 'Letters, digits, underscores, hyphens only';
  }

  return e;
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function InternalPlanForm() {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const isEdit    = !!id;

  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(isEdit);
  const [planName, setPlanName]     = useState('');
  const [planRefId, setPlanRefId]   = useState('');

  /* ── Course options ── */
  const [courseOptions, setCourseOptions] = useState([]);

  useEffect(() => {
    courseService.list({ limit: 100, status: 'ACTIVE' })
      .then(({ courses }) => setCourseOptions(courses ?? []))
      .catch(() => {});
  }, []);

  /* ── Load existing plan for edit ── */
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    internalPlansService
      .getById(id)
      .then((plan) => {
        setPlanName(plan.name ?? '');
        setPlanRefId(plan.refId ?? '');
        setForm({
          name:        plan.name ?? '',
          duration:    plan.duration ?? DEFAULT_PLAN_DURATION,
          description: plan.description ?? '',
          courseId:    plan.courseId != null ? String(plan.courseId) : '',
          status:      plan.status ?? 'ACTIVE',
          externalPlanId: plan.externalPlanId ?? '',
        });
      })
      .catch((err) => toast.error(err.message ?? 'Failed to load plan'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  /* ── Field helpers ── */
  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleBlur = (key) => {
    const e = validateForm(form);
    if (e[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: e[key] }));
    } else {
      setFormErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  /* ── Save handler ── */
  const handleSave = async () => {
    const e = validateForm(form);

    if (Object.keys(e).length) {
      setFormErrors(e);
      return;
    }

    setFormErrors({});
    setSaving(true);

    try {
      // `coupons` is intentionally omitted from the payload.
      // - On create: backend defaults it to [].
      // - On update: backend only touches coupons when the field is sent,
      //   so existing data on the row is preserved untouched.
      const payload = {
        name:        form.name.trim(),
        duration:    form.duration,
        description: form.description.trim() || null,
        courseId:    Number(form.courseId),
        status:      form.status,
        externalPlanId: form.externalPlanId.trim(),
      };

      if (isEdit) {
        await internalPlansService.update(id, payload);
        toast.success('Internal plan updated');
      } else {
        await internalPlansService.create(payload);
        toast.success('Internal plan created');
      }
      navigate('/admin/internal-plans');
    } catch (err) {
      toast.error(err.message ?? 'Failed to save internal plan');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Loading state ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Internal Plan" subtitle="Loading..." />
        <Card>
          <div className="py-16 text-center text-slate-500 text-sm">Loading plan...</div>
        </Card>
      </div>
    );
  }

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? `Edit: ${planName || form.name || 'Internal Plan'}` : 'Add Internal Plan'}
        subtitle={isEdit ? 'Update plan details' : 'Create a new course-specific internal plan'}
        action={
          <Button variant="secondary" onClick={() => navigate('/admin/internal-plans')}>
            Cancel
          </Button>
        }
      />

      {/* ── Section 1: Plan Details ── */}
      <Card title="Plan Details">
        <div className="space-y-5">
          {isEdit && planRefId && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Webhook Reference ID
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1.5 rounded select-all">
                  {planRefId}
                </span>
                <button
                  type="button"
                  className="text-xs text-brand-600 hover:text-brand-800"
                  onClick={() => {
                    navigator.clipboard?.writeText(planRefId);
                    toast.success('Reference ID copied');
                  }}
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Sent to webhook subscribers on every enrollment created with this plan. Immutable.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Plan Name"
              required
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="e.g. Data Science — 6 Month Intensive"
              error={formErrors.name}
            />

            <Input
              id="internal-plan-id"
              label="Plan ID* ( From Kommon School Provider)"
              value={form.externalPlanId}
              onChange={(e) => setField('externalPlanId', e.target.value)}
              onBlur={() => handleBlur('externalPlanId')}
              placeholder="e.g. SUMAGOTEST_SCOPE_30DAYS"
              maxLength={100}
              autoComplete="off"
              spellCheck={false}
              hint="Sent as planId in Sumago webhook. Must be unique."
              error={formErrors.externalPlanId}
            />
          </div>

          <SearchableSelect
            label="Course"
            required
            value={form.courseId}
            onChange={(val) => setField('courseId', val)}
            error={formErrors.courseId}
            placeholder="Search a course…"
            noResultsText="No courses match"
            options={[...courseOptions]
              .sort((a, b) => {
                const n = (a.nameOfCourseAsGroup ?? '').localeCompare(b.nameOfCourseAsGroup ?? '');
                if (n !== 0) return n;
                return (a.duration?.sortOrder ?? 0) - (b.duration?.sortOrder ?? 0);
              })
              .map((c) => {
                // Each course offering is a unique (Course Name × Duration)
                // row, so the label includes both — otherwise the same name
                // appears N times (once per duration variant) and looks like
                // duplicates.
                const durLabel = c.duration?.label ? ` — ${c.duration.label}` : '';
                const feeLabel = c.courseFee != null
                  ? `₹${Number(c.courseFee).toLocaleString('en-IN')}`
                  : null;
                return {
                  value: String(c.id),
                  label: `${c.nameOfCourseAsGroup}${durLabel}`,
                  hint:  feeLabel,
                };
              })
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Price (from selected Course)
              </label>
              <div className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                {(() => {
                  if (!form.courseId) return <span className="text-slate-400">Select a course to see its fee</span>;
                  const fee = courseOptions.find((c) => String(c.id) === String(form.courseId))?.courseFee;
                  if (fee == null) return <span className="text-slate-400">—</span>;
                  return `₹${Number(fee).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                })()}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Price is managed on the Course. Update the course fee to change it.
              </p>
            </div>

            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>

          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            placeholder="Brief plan overview (optional, max 2000 chars)"
            error={formErrors.description}
          />
        </div>
      </Card>

      {/* ── Footer actions ── */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Button variant="secondary" onClick={() => navigate('/admin/internal-plans')}>
          Cancel
        </Button>
        <Button variant="primary" loading={saving} onClick={handleSave}>
          {saving ? 'Saving...' : isEdit ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </div>
  );
}
