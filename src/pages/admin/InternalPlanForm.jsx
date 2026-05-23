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
  Badge,
} from '../../components/admin';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const EMPTY_COUPON = {
  code:          '',
  discountType:  'PERCENT',
  discountValue: '',
  expiryDate:    '',
  usageLimit:    '',
  usedCount:     0,
  status:        'ACTIVE',
};

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
  coupons:     [],
  // Optional override for the `plan` field sent in the Sumago provision-
  // user webhook. Blank → backend falls back to SUMAGO_PLAN_CODE env var.
  sumagoPlanCode: '',
};

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

  return e;
}

function validateCoupon(coupon) {
  const e = {};
  const code = coupon.code.trim();
  if (!code) {
    e.code = 'Coupon code is required';
  } else if (code.length > 50) {
    e.code = 'Code must be at most 50 characters';
  }

  const val = Number(coupon.discountValue);
  if (coupon.discountValue === '' || isNaN(val) || val <= 0) {
    e.discountValue = 'Discount value must be a positive number';
  } else if (coupon.discountType === 'PERCENT' && val > 100) {
    e.discountValue = 'Percent discount cannot exceed 100';
  }

  if (coupon.usageLimit !== '' && coupon.usageLimit !== null) {
    const lim = Number(coupon.usageLimit);
    if (isNaN(lim) || lim < 1) {
      e.usageLimit = 'Usage limit must be a positive integer';
    }
  }

  return e;
}

/* ─── Coupon form row ────────────────────────────────────────────────────── */
function CouponRow({ coupon, idx, onChange, onRemove, errors }) {
  const err = errors ?? {};

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Coupon {idx + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-400 hover:text-red-600 transition-colors"
          aria-label="Remove coupon"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={coupon.code}
            onChange={(e) => onChange('code', e.target.value.toUpperCase().slice(0, 50))}
            placeholder="e.g. WELCOME10"
            maxLength={50}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
          />
          {err.code && <p className="text-red-500 text-xs mt-1">{err.code}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
          <select
            value={coupon.status}
            onChange={(e) => onChange('status', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Type</label>
          <select
            value={coupon.discountType}
            onChange={(e) => onChange('discountType', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
          >
            <option value="PERCENT">Percent (%)</option>
            <option value="FLAT">Flat (₹)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Discount Value <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step={coupon.discountType === 'PERCENT' ? '0.1' : '1'}
            max={coupon.discountType === 'PERCENT' ? '100' : undefined}
            value={coupon.discountValue}
            onChange={(e) => onChange('discountValue', e.target.value)}
            placeholder={coupon.discountType === 'PERCENT' ? 'e.g. 10' : 'e.g. 500'}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
          />
          {err.discountValue && <p className="text-red-500 text-xs mt-1">{err.discountValue}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Usage Limit</label>
          <input
            type="number"
            min="1"
            step="1"
            value={coupon.usageLimit}
            onChange={(e) => onChange('usageLimit', e.target.value)}
            placeholder="e.g. 100 (leave blank = unlimited)"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
          />
          {err.usageLimit && <p className="text-red-500 text-xs mt-1">{err.usageLimit}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
          <input
            type="date"
            value={coupon.expiryDate}
            onChange={(e) => onChange('expiryDate', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
          />
        </div>
        {coupon.usedCount > 0 && (
          <div className="flex items-end">
            <Badge variant="neutral">{coupon.usedCount} uses</Badge>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function InternalPlanForm() {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const isEdit    = !!id;

  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [couponErrors, setCouponErrors] = useState([]);
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
          sumagoPlanCode: plan.sumagoPlanCode ?? '',
          coupons:     (plan.coupons ?? []).map((c) => ({
            ...c,
            discountValue: String(c.discountValue ?? ''),
            usageLimit:    c.usageLimit != null ? String(c.usageLimit) : '',
            expiryDate:    c.expiryDate ? c.expiryDate.slice(0, 10) : '',
          })),
        });
        setCouponErrors(Array(plan.coupons?.length ?? 0).fill({}));
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

  /* ── Coupon helpers ── */
  const addCoupon = () => {
    setForm((prev) => ({ ...prev, coupons: [...prev.coupons, { ...EMPTY_COUPON }] }));
    setCouponErrors((prev) => [...prev, {}]);
  };

  const removeCoupon = (idx) => {
    setForm((prev) => ({ ...prev, coupons: prev.coupons.filter((_, i) => i !== idx) }));
    setCouponErrors((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCoupon = (idx, key, val) => {
    setForm((prev) => {
      const coupons = [...prev.coupons];
      coupons[idx] = { ...coupons[idx], [key]: val };
      return { ...prev, coupons };
    });
  };

  /* ── Save handler ── */
  const handleSave = async () => {
    const e = validateForm(form);

    // Validate each coupon
    const cErrs = form.coupons.map((c) => validateCoupon(c));
    const hasCouponErrs = cErrs.some((ce) => Object.keys(ce).length > 0);

    if (Object.keys(e).length || hasCouponErrs) {
      setFormErrors(e);
      setCouponErrors(cErrs);
      return;
    }

    setFormErrors({});
    setCouponErrors(Array(form.coupons.length).fill({}));
    setSaving(true);

    try {
      const payload = {
        name:        form.name.trim(),
        duration:    form.duration,
        description: form.description.trim() || null,
        courseId:    Number(form.courseId),
        status:      form.status,
        sumagoPlanCode: form.sumagoPlanCode?.trim() || null,
        coupons:     form.coupons.map((c) => ({
          ...c,
          code:          c.code.trim().toUpperCase(),
          discountValue: Number(c.discountValue),
          usageLimit:    c.usageLimit !== '' && c.usageLimit !== null ? Number(c.usageLimit) : null,
          expiryDate:    c.expiryDate || null,
          usedCount:     Number(c.usedCount ?? 0),
        })),
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
        subtitle={isEdit ? 'Update plan details and coupons' : 'Create a new course-specific internal plan'}
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

          <Select
            label="Course"
            required
            value={form.courseId}
            onChange={(e) => { setField('courseId', e.target.value); }}
            error={formErrors.courseId}
          >
            <option value="">Select a course...</option>
            {/* Each course offering is a unique (Course Name × Duration) row,
                so the label includes both — otherwise the same name appears
                N times (once per duration variant) and looks like duplicates. */}
            {[...courseOptions]
              .sort((a, b) => {
                const n = (a.nameOfCourseAsGroup ?? '').localeCompare(b.nameOfCourseAsGroup ?? '');
                if (n !== 0) return n;
                return (a.duration?.sortOrder ?? 0) - (b.duration?.sortOrder ?? 0);
              })
              .map((c) => {
                const durLabel = c.duration?.label ? ` — ${c.duration.label}` : '';
                const feeLabel = c.courseFee != null ? ` · ₹${Number(c.courseFee).toLocaleString('en-IN')}` : '';
                return (
                  <option key={c.id} value={String(c.id)}>
                    {c.nameOfCourseAsGroup}{durLabel}{feeLabel}
                  </option>
                );
              })}
          </Select>

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

          {/* Optional Sumago plan-code override. When set, this plan's
              students will appear in Sumago with THIS plan string instead
              of the org-wide SUMAGO_PLAN_CODE env default. Leave blank to
              keep using the env default. */}
          <Input
            label="Sumago Plan Code (override)"
            value={form.sumagoPlanCode}
            onChange={(e) => setField('sumagoPlanCode', e.target.value)}
            placeholder="e.g. NOVA2025_GOLD — leave blank to use env default"
            hint="Optional. Must match a plan code registered on Sumago. Blank = use SUMAGO_PLAN_CODE env."
          />
        </div>
      </Card>

      {/* ── Section 2: Coupons ── */}
      <Card title="Coupons">
        <div className="space-y-4">
          {form.coupons.length === 0 && (
            <p className="text-xs text-slate-400 italic">No coupons added yet.</p>
          )}

          {form.coupons.map((coupon, idx) => (
            <CouponRow
              key={idx}
              coupon={coupon}
              idx={idx}
              onChange={(key, val) => updateCoupon(idx, key, val)}
              onRemove={() => removeCoupon(idx)}
              errors={couponErrors[idx]}
            />
          ))}

          <Button
            variant="secondary"
            onClick={addCoupon}
            disabled={form.coupons.length >= 10}
          >
            + Add Coupon
          </Button>
          <p className="text-xs text-slate-400">
            {form.coupons.length}/10 coupons. Each coupon is specific to this plan.
          </p>
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
