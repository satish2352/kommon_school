import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { plansAdminService } from '../../services/plansAdminService';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Textarea,
  Select,
} from '../../components/admin';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const DURATION_MONTHS = [1, 3, 6, 12];
const TIERS = ['SILVER', 'GOLD', 'PLATINUM'];

const EMPTY_PRICING = {
  basePrice:       '',
  discountPercent: '0',
  finalPrice:      '',
  discountLabel:   '',
  status:          'ACTIVE',
};

const EMPTY_FORM = {
  name:           '',
  tier:           '',
  tagline:        '',
  description:    '',
  highlightLabel: '',
  promoCode:      'NEW501',
  sortOrder:      '0',
  status:         'ACTIVE',
  features:       [],
  pricings:       {
    1:  { ...EMPTY_PRICING },
    3:  { ...EMPTY_PRICING },
    6:  { ...EMPTY_PRICING },
    12: { ...EMPTY_PRICING },
  },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function calcFinalPrice(basePrice, discountPercent) {
  const base  = parseFloat(basePrice)       || 0;
  const pct   = parseFloat(discountPercent) || 0;
  const final = base * (1 - pct / 100);
  return final > 0 ? final.toFixed(2) : '';
}

function validateForm(form) {
  const e = {};
  if (!form.name.trim()) e.name = 'Name is required';
  else if (form.name.trim().length > 100) e.name = 'Name must be at most 100 characters';
  if (!form.tier) e.tier = 'Tier is required';
  if (form.tagline && form.tagline.length > 200) e.tagline = 'Tagline must be at most 200 characters';
  if (form.description && form.description.length > 2000) e.description = 'Description must be at most 2000 characters';
  if (form.highlightLabel && form.highlightLabel.length > 50) e.highlightLabel = 'Highlight label must be at most 50 characters';
  if (form.promoCode && form.promoCode.length > 50) e.promoCode = 'Promo code must be at most 50 characters';
  if (form.sortOrder !== '' && isNaN(Number(form.sortOrder))) {
    e.sortOrder = 'Sort order must be a number';
  }
  return e;
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function PlanForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = !!id;

  const [form, setForm]             = useState(EMPTY_FORM);
  const [featureInput, setFeatureInput] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(isEdit);
  const [planName, setPlanName]     = useState('');
  const [isSystemDefault, setIsSystemDefault] = useState(false);

  /* ── Load existing plan for edit ── */
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    plansAdminService
      .getById(id)
      .then((plan) => {
        setPlanName(plan.name ?? '');
        setIsSystemDefault(!!plan.isSystemDefault);
        // Reconstruct pricing map from plan.pricings array
        const pricings = {
          1:  { ...EMPTY_PRICING },
          3:  { ...EMPTY_PRICING },
          6:  { ...EMPTY_PRICING },
          12: { ...EMPTY_PRICING },
        };
        for (const p of plan.pricings ?? []) {
          if (DURATION_MONTHS.includes(p.durationMonths)) {
            pricings[p.durationMonths] = {
              basePrice:       String(p.basePrice ?? ''),
              discountPercent: String(p.discountPercent ?? '0'),
              finalPrice:      String(p.finalPrice ?? ''),
              discountLabel:   p.discountLabel ?? '',
              status:          p.status ?? 'ACTIVE',
              id:              p.id,
            };
          }
        }
        setForm({
          name:           plan.name ?? '',
          tier:           plan.tier ?? '',
          tagline:        plan.tagline ?? '',
          description:    plan.description ?? '',
          highlightLabel: plan.highlightLabel ?? '',
          promoCode:      plan.promoCode ?? '',
          sortOrder:      String(plan.sortOrder ?? 0),
          status:         plan.status ?? 'ACTIVE',
          features:       Array.isArray(plan.features) ? plan.features : [],
          pricings,
        });
      })
      .catch((err) => toast.error(err.message ?? 'Failed to load plan'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  /* ── Field helpers ── */
  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const setPricingField = (months, key, val) => {
    setForm((prev) => {
      const updated = {
        ...prev.pricings,
        [months]: { ...prev.pricings[months], [key]: val },
      };
      // Auto-calculate finalPrice when basePrice or discountPercent changes
      if (key === 'basePrice' || key === 'discountPercent') {
        const p    = updated[months];
        const auto = calcFinalPrice(p.basePrice, p.discountPercent);
        updated[months].finalPrice = auto;
      }
      return { ...prev, pricings: updated };
    });
  };

  /* ── Features helpers ── */
  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed || form.features.length >= 20) return;
    setForm((prev) => ({ ...prev, features: [...prev.features, trimmed] }));
    setFeatureInput('');
  };

  const removeFeature = (idx) => {
    setForm((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  };

  /* ── Save handler ── */
  const handleSave = async () => {
    const e = validateForm(form);
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setFormErrors({});
    setSaving(true);

    try {
      // Build pricings array (only rows with a basePrice set)
      const pricingsArray = DURATION_MONTHS
        .filter((m) => form.pricings[m].basePrice !== '')
        .map((m) => {
          const p = form.pricings[m];
          return {
            durationMonths:  m,
            basePrice:       parseFloat(p.basePrice),
            discountPercent: parseFloat(p.discountPercent) || 0,
            discountLabel:   p.discountLabel.trim() || null,
            status:          p.status,
          };
        });

      // For create: include tier. For edit: omit tier (backend forbids it in PATCH).
      const planPayload = {
        name:           form.name.trim(),
        ...(isEdit ? {} : { tier: form.tier }),
        tagline:        form.tagline.trim()        || null,
        description:    form.description.trim()    || null,
        highlightLabel: form.highlightLabel.trim() || null,
        promoCode:      form.promoCode.trim().toUpperCase() || null,
        sortOrder:      parseInt(form.sortOrder, 10) || 0,
        status:         form.status,
        features:       form.features,
      };

      if (isEdit) {
        // 1. Update plan metadata
        await plansAdminService.update(id, planPayload);
        // 2. Upsert each pricing row that has a basePrice
        for (const p of pricingsArray) {
          await plansAdminService.upsertPricing(id, p.durationMonths, p);
        }
        toast.success('Plan updated');
      } else {
        // Create plan + pricings in one flat request (backend expects top-level fields)
        await plansAdminService.create({ ...planPayload, pricings: pricingsArray });
        toast.success('Plan created');
      }
      navigate('/admin/plans');
    } catch (err) {
      // Surface backend field-level errors from Joi details[]
      if (err?.details && Array.isArray(err.details)) {
        const fieldErrs = {};
        for (const d of err.details) {
          const key = d.context?.key ?? d.path?.[0];
          if (key) fieldErrs[key] = d.message;
        }
        if (Object.keys(fieldErrs).length) {
          setFormErrors(fieldErrs);
          toast.error('Please fix the form errors below');
          return;
        }
      }
      toast.error(err.message ?? 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Plan" subtitle="Loading..." />
        <Card>
          <div className="py-16 text-center text-slate-500 text-sm">Loading plan...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? `Edit: ${planName || form.name || 'Plan'}` : 'Add Plan'}
        subtitle={isEdit ? 'Update plan metadata and pricing' : 'Create a new subscription plan'}
        action={
          <Button variant="secondary" onClick={() => navigate('/admin/plans')}>
            Cancel
          </Button>
        }
      />

      {/* ── Section 1: Plan basics ───────────────────────────────────────── */}
      <Card title="Plan Details">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Plan Name"
              required
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Silver"
              error={formErrors.name}
            />

            <Select
              label="Tier"
              required
              value={form.tier}
              onChange={(e) => setField('tier', e.target.value)}
              disabled={isEdit}
              error={formErrors.tier}
            >
              <option value="">Select tier...</option>
              {TIERS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tagline"
              type="text"
              value={form.tagline}
              onChange={(e) => setField('tagline', e.target.value)}
              placeholder="e.g. Get started quickly"
              error={formErrors.tagline}
            />
            <Input
              label="Highlight Label"
              type="text"
              value={form.highlightLabel}
              onChange={(e) => setField('highlightLabel', e.target.value)}
              placeholder="e.g. Most Popular"
              hint="Shown as a badge on the plan card"
              error={formErrors.highlightLabel}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Promo Code"
              type="text"
              value={form.promoCode}
              onChange={(e) => setField('promoCode', e.target.value.toUpperCase())}
              placeholder="e.g. NEW501"
              error={formErrors.promoCode}
            />
            <Input
              label="Sort Order"
              type="number"
              min="0"
              step="1"
              value={form.sortOrder}
              onChange={(e) => setField('sortOrder', e.target.value)}
              placeholder="0"
              error={formErrors.sortOrder}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              disabled={isSystemDefault}
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
            placeholder="Describe what this plan includes..."
            error={formErrors.description}
          />
        </div>
      </Card>

      {/* ── Section 2: Features ─────────────────────────────────────────── */}
      <Card title="Features">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
              placeholder="Add a feature and press Enter or click Add"
              maxLength={200}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
            />
            <Button
              variant="secondary"
              onClick={addFeature}
              disabled={form.features.length >= 20}
            >
              Add
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            {form.features.length}/20 features. Max 200 characters each.
          </p>
          {form.features.length === 0 && (
            <p className="text-xs text-slate-400 italic">No features added yet.</p>
          )}
          <ul className="space-y-2">
            {form.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                <span className="text-emerald-500 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="flex-1 break-all">{f}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                  aria-label="Remove feature"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* ── Section 3: Pricing matrix ──────────────────────────────────── */}
      <Card title="Pricing Matrix">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-24">Duration</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Base Price (₹)</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Discount %</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Final Price (₹)</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Discount Label</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DURATION_MONTHS.map((months) => {
                const p = form.pricings[months];
                return (
                  <tr key={months}>
                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                      {months === 1 ? '1 Month' : `${months} Months`}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={p.basePrice}
                        onChange={(e) => setPricingField(months, 'basePrice', e.target.value)}
                        placeholder="0.00"
                        className="w-28 px-2 py-1.5 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={p.discountPercent}
                        onChange={(e) => setPricingField(months, 'discountPercent', e.target.value)}
                        className="w-20 px-2 py-1.5 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-28 px-2 py-1.5 text-sm rounded-md border border-slate-200 bg-slate-50 text-slate-700 font-medium">
                        {p.finalPrice || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={p.discountLabel}
                        onChange={(e) => setPricingField(months, 'discountLabel', e.target.value)}
                        placeholder="e.g. Save 10%"
                        maxLength={100}
                        className="w-32 px-2 py-1.5 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={p.status}
                        onChange={(e) => setPricingField(months, 'status', e.target.value)}
                        className="px-2 py-1.5 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-slate-400 mt-3 px-4">
            {isEdit
              ? 'Each row is upserted (created or updated) on save. Leave Base Price empty to skip that duration.'
              : 'All four durations are required for a new plan. Leave Base Price empty to skip a duration.'}
          </p>
        </div>
      </Card>

      {/* ── Footer actions ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Button variant="secondary" onClick={() => navigate('/admin/plans')}>
          Cancel
        </Button>
        <Button variant="primary" loading={saving} onClick={handleSave}>
          {saving ? 'Saving...' : isEdit ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </div>
  );
}
