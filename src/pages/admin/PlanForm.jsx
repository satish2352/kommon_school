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
  PageLoader,
} from '../../components/admin';

/* ─── Constants ──────────────────────────────────────────────────────────── */
// Durations pre-seeded on a brand-new plan. Admins can edit these or add their
// own custom durations (any positive integer, in days or months).
const DEFAULT_DURATIONS = [1, 3, 6, 12];
// Per-unit caps for the duration value (frontend guidance; backend caps at 3650).
const MAX_DURATION_BY_UNIT = { MONTHS: 120, DAYS: 3650 };
const DURATION_UNITS = ['MONTHS', 'DAYS'];
const TIERS = ['SILVER', 'GOLD', 'PLATINUM'];

const EMPTY_PRICING = {
  durationMonths:  '',
  durationUnit:    'MONTHS',
  basePrice:       '',
  discountPercent: '0',
  finalPrice:      '',
  discountLabel:   '',
  externalPlanId:  '',
  status:          'ACTIVE',
};

// Mirrors backend Joi pattern. Trim before testing.
const EXTERNAL_PLAN_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

// Monotonic key generator so each pricing row keeps a stable React key even as
// rows are added/removed and their (editable) duration changes.
let _rowKeySeq = 0;
function makePricingRow(overrides = {}) {
  return { _key: `pr_${_rowKeySeq++}`, ...EMPTY_PRICING, ...overrides };
}

function defaultPricingRows() {
  return DEFAULT_DURATIONS.map((d) => makePricingRow({ durationMonths: String(d) }));
}

const EMPTY_FORM = {
  name:           '',
  tier:           '',
  tagline:        '',
  description:    '',
  highlightLabel: '',
  sortOrder:      '0',
  status:         'ACTIVE',
  features:       [],
  pricings:       [],
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function calcFinalPrice(basePrice, discountPercent) {
  const base  = parseFloat(basePrice)       || 0;
  const pct   = parseFloat(discountPercent) || 0;
  const final = base * (1 - pct / 100);
  return final > 0 ? final.toFixed(2) : '';
}

// A row is "blank" when none of its meaningful fields are filled (defaulted
// unit/discount/status are ignored). Blank rows are allowed while editing but
// must be filled in or removed before the form can be saved.
function isBlankPricingRow(row) {
  return !String(row.durationMonths ?? '').trim()
    && (row.basePrice === '' || row.basePrice == null)
    && !String(row.externalPlanId ?? '').trim()
    && !String(row.discountLabel ?? '').trim();
}

// Per-row pricing validation. Returns a map of row._key -> { duration?, basePrice?, planId? }.
// Computed live on every render so the admin sees duplicate-Plan-ID and
// duplicate-duration errors as they type — not just on save.
//
// requireAll: when true, EVERY row (including blank ones) must be fully filled,
// so a half-finished or empty row blocks the save. When false (the default,
// live-typing pass) blank rows are left alone so a freshly-opened form / a
// just-added empty row doesn't show a wall of red before the user has typed.
function computePricingIssues(rows, { requireAll = false } = {}) {
  const issues = {};
  const idCounts  = {}; // normalized Plan ID            -> occurrences
  const durCounts = {}; // "<value>-<UNIT>" duration key -> occurrences

  for (const row of rows) {
    const id = (row.externalPlanId || '').trim();
    if (id) idCounts[id] = (idCounts[id] || 0) + 1;
    // Number() (not parseInt) so 1 and 1.5 are kept distinct rather than both
    // truncated to 1. A duration is only a duplicate when BOTH the number and
    // the unit match, so "2 Days" and "2 Months" coexist but two "2 Months"
    // (or two "1.5 Months") rows clash.
    const durRaw = String(row.durationMonths ?? '').trim();
    const dur = durRaw === '' ? NaN : Number(durRaw);
    const unit = (row.durationUnit || 'MONTHS').toUpperCase();
    if (!isNaN(dur)) {
      const durKey = `${dur}-${unit}`;
      durCounts[durKey] = (durCounts[durKey] || 0) + 1;
    }
  }

  for (const row of rows) {
    const rowIssue = {};

    if (isBlankPricingRow(row)) {
      // Flag a blank row only on save so the form doesn't pre-yell at the user.
      if (requireAll) {
        rowIssue.duration  = 'Duration is required';
        rowIssue.basePrice = 'Base price is required';
        rowIssue.planId    = 'Plan ID is required';
        issues[row._key] = rowIssue;
      }
      continue;
    }

    const unit = (row.durationUnit || 'MONTHS').toUpperCase();
    const maxDur = MAX_DURATION_BY_UNIT[unit] ?? 120;
    const durRaw = String(row.durationMonths ?? '').trim();
    const dur = durRaw === '' ? NaN : Number(durRaw);
    if (!durRaw)                     rowIssue.duration = 'Duration is required';
    else if (isNaN(dur) || dur <= 0) rowIssue.duration = 'Must be a positive number';
    else if (dur > maxDur)           rowIssue.duration = `Must be at most ${maxDur} ${unit === 'DAYS' ? 'days' : 'months'}`;
    else if (durCounts[`${dur}-${unit}`] > 1) rowIssue.duration = 'Duplicate duration (same number and unit)';

    const baseRaw = String(row.basePrice ?? '').trim();
    const base = Number(baseRaw);
    if (!baseRaw)                     rowIssue.basePrice = 'Base price is required';
    else if (isNaN(base) || base < 0) rowIssue.basePrice = 'Must be 0 or more';
    else if (base > 999999.99)        rowIssue.basePrice = 'Max ₹999,999.99';

    const id = (row.externalPlanId || '').trim();
    if (!id)                                     rowIssue.planId = 'Plan ID is required';
    else if (id.length > 100)                    rowIssue.planId = 'Must be at most 100 characters';
    else if (!EXTERNAL_PLAN_ID_PATTERN.test(id)) rowIssue.planId = 'Letters, digits, underscores, hyphens only';
    else if (idCounts[id] > 1)                   rowIssue.planId = 'Plan ID already exists';

    if (Object.keys(rowIssue).length) issues[row._key] = rowIssue;
  }
  return issues;
}

function validateForm(form, isEdit) {
  const e = {};
  if (!form.name.trim()) e.name = 'Plan Name is required';
  else if (form.name.trim().length > 100) e.name = 'Plan Name must be at most 100 characters';
  if (!form.tier) e.tier = 'Tier is required';
  if (form.tagline && form.tagline.length > 150) e.tagline = 'Tagline must be at most 150 characters';
  if (form.description && form.description.length > 500) e.description = 'Description must be at most 500 characters';
  if (form.highlightLabel && form.highlightLabel.length > 50) e.highlightLabel = 'Highlight Label must be at most 50 characters';
  if (form.sortOrder !== '' && isNaN(Number(form.sortOrder))) {
    e.sortOrder = 'Sort order must be a number';
  }

  const pricedRows = form.pricings.filter((r) => r.basePrice !== '' && r.basePrice != null);
  if (!isEdit && pricedRows.length === 0) {
    e.pricingsGeneral = 'Add at least one pricing row with a base price';
  }
  // On save, every row must be complete (or removed) — no silently-skipped
  // blank/partial rows.
  const pricingIssues = computePricingIssues(form.pricings, { requireAll: true });
  if (Object.keys(pricingIssues).length) {
    e.pricings = pricingIssues;
    if (!e.pricingsGeneral) e.pricingsGeneral = 'Fill in every pricing row completely, or remove the empty ones, before saving.';
  }

  return e;
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function PlanForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = !!id;

  const [form, setForm]             = useState(() => ({ ...EMPTY_FORM, pricings: defaultPricingRows() }));
  const [featureInput, setFeatureInput] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);
  // Becomes true after the first save attempt; switches the pricing matrix into
  // "every row required" mode so blank/partial rows light up.
  const [triedSave, setTriedSave]   = useState(false);
  const [loading, setLoading]       = useState(isEdit);
  const [planName, setPlanName]     = useState('');
  const [isSystemDefault, setIsSystemDefault] = useState(false);
  // Backend IDs of already-persisted pricing rows the admin removed from the
  // matrix. These are deleted on save so they don't reappear on reload.
  const [deletedPricingIds, setDeletedPricingIds] = useState([]);

  /* ── Load existing plan for edit ── */
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    setDeletedPricingIds([]);
    plansAdminService
      .getById(id)
      .then((plan) => {
        setPlanName(plan.name ?? '');
        setIsSystemDefault(!!plan.isSystemDefault);
        // Reconstruct pricing rows from plan.pricings array (any durations).
        const pricingRows = (plan.pricings ?? []).map((p) => makePricingRow({
          // Decimal comes back as a string like "1.00"/"1.50"; Number() strips
          // trailing zeros so the input shows "1" / "1.5", not "1.00".
          durationMonths:  p.durationMonths != null ? String(Number(p.durationMonths)) : '',
          durationUnit:    (p.durationUnit ?? 'MONTHS').toUpperCase(),
          basePrice:       String(p.basePrice ?? ''),
          discountPercent: String(p.discountPercent ?? '0'),
          finalPrice:      String(p.finalPrice ?? ''),
          discountLabel:   p.discountLabel ?? '',
          externalPlanId:  p.externalPlanId ?? '',
          status:          p.status ?? 'ACTIVE',
          id:              p.id,
        }));
        const pricings = pricingRows.length ? pricingRows : defaultPricingRows();
        setForm({
          name:           plan.name ?? '',
          tier:           plan.tier ?? '',
          tagline:        plan.tagline ?? '',
          description:    plan.description ?? '',
          highlightLabel: plan.highlightLabel ?? '',
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

  const setPricingRow = (rowKey, field, val) => {
    setForm((prev) => ({
      ...prev,
      pricings: prev.pricings.map((row) => {
        if (row._key !== rowKey) return row;
        const updated = { ...row, [field]: val };
        // Auto-calculate finalPrice when basePrice or discountPercent changes
        if (field === 'basePrice' || field === 'discountPercent') {
          updated.finalPrice = calcFinalPrice(updated.basePrice, updated.discountPercent);
        }
        return updated;
      }),
    }));
  };

  const addPricingRow = () =>
    setForm((prev) => ({ ...prev, pricings: [...prev.pricings, makePricingRow()] }));

  const removePricingRow = (rowKey) => {
    // If this row already exists in the backend, remember its ID so save() can
    // delete it — otherwise it survives server-side and reappears on reload.
    const removed = form.pricings.find((r) => r._key === rowKey);
    if (removed?.id != null) {
      setDeletedPricingIds((ids) => (ids.includes(removed.id) ? ids : [...ids, removed.id]));
    }
    setForm((prev) => ({ ...prev, pricings: prev.pricings.filter((r) => r._key !== rowKey) }));
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
    setTriedSave(true);
    const e = validateForm(form, isEdit);
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setFormErrors({});
    setSaving(true);

    try {
      // Build pricings array (only rows with a basePrice set)
      const pricingsArray = form.pricings
        .filter((r) => r.basePrice !== '' && r.basePrice != null)
        .map((r) => ({
          durationMonths:  Number(r.durationMonths),
          durationUnit:    (r.durationUnit || 'MONTHS').toUpperCase(),
          basePrice:       parseFloat(r.basePrice),
          discountPercent: parseFloat(r.discountPercent) || 0,
          discountLabel:   r.discountLabel.trim() || null,
          externalPlanId:  r.externalPlanId.trim(),
          status:          r.status,
        }));

      // For create: include tier. For edit: omit tier (backend forbids it in PATCH).
      const planPayload = {
        name:           form.name.trim(),
        ...(isEdit ? {} : { tier: form.tier }),
        tagline:        form.tagline.trim()        || null,
        description:    form.description.trim()    || null,
        highlightLabel: form.highlightLabel.trim() || null,
        sortOrder:      parseInt(form.sortOrder, 10) || 0,
        status:         form.status,
        features:       form.features,
      };

      if (isEdit) {
        // 1. Update plan metadata
        await plansAdminService.update(id, planPayload);
        // 2. Delete pricing rows the admin removed from the matrix. Done before
        //    the upserts so a removed-then-re-added duration doesn't collide on
        //    the (plan, duration) upsert key. The backend hard-deletes when the
        //    row is unreferenced and soft-deactivates when enrollments depend on it.
        for (const pricingId of deletedPricingIds) {
          await plansAdminService.deactivatePricing(id, pricingId);
        }
        // 3. Upsert each remaining pricing row that has a basePrice
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
  // Live per-row pricing issues (duplicate Plan ID / duration, missing fields).
  // After a save attempt, blank rows are flagged too so the user sees exactly
  // which rows still need completing.
  const pricingIssues = computePricingIssues(form.pricings, { requireAll: triedSave });

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Plan" subtitle="Loading..." />
        <Card>
          <PageLoader label="Loading plan…" />
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
              maxLength={100}
              showCount
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
              label="Tagline (Optional)"
              type="text"
              value={form.tagline}
              onChange={(e) => setField('tagline', e.target.value)}
              placeholder="e.g. Get started quickly"
              maxLength={150}
              showCount
              error={formErrors.tagline}
            />
            <Input
              label="Highlight Label (Optional)"
              type="text"
              value={form.highlightLabel}
              onChange={(e) => setField('highlightLabel', e.target.value)}
              placeholder="e.g. Most Popular"
              hint="Shown as a badge on the plan card"
              maxLength={50}
              showCount
              error={formErrors.highlightLabel}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            label="Description (Optional)"
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Describe what this plan includes..."
            maxLength={500}
            showCount
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
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-48">
                  Duration <span className="text-red-500">*</span>
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Base Price (₹)</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Discount %</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Final Price (₹)</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Discount Label</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                  Plan ID <span className="text-red-500">*</span>
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="px-4 py-3 w-12"><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {form.pricings.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400">
                    No pricing rows. Click “Add Pricing” to add one.
                  </td>
                </tr>
              )}
              {form.pricings.map((p) => {
                const rowErr = pricingIssues[p._key] ?? {};
                const inputBorder = (hasErr) => hasErr
                  ? 'border-red-400 focus:ring-red-300 focus:border-red-400'
                  : 'border-slate-300 focus:ring-brand-300 focus:border-brand-400';
                return (
                  <tr key={p._key}>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max={MAX_DURATION_BY_UNIT[(p.durationUnit || 'MONTHS').toUpperCase()] ?? 120}
                          step="any"
                          value={p.durationMonths}
                          onChange={(e) => setPricingRow(p._key, 'durationMonths', e.target.value)}
                          placeholder="e.g. 1.5"
                          className={`w-20 px-2 py-1.5 text-sm rounded-md border bg-white focus:outline-none focus:ring-2 transition-colors ${inputBorder(!!rowErr.duration)}`}
                          aria-invalid={rowErr.duration ? 'true' : 'false'}
                        />
                        <select
                          value={p.durationUnit || 'MONTHS'}
                          onChange={(e) => setPricingRow(p._key, 'durationUnit', e.target.value)}
                          className="px-2 py-1.5 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
                          aria-label="Duration unit"
                        >
                          {DURATION_UNITS.map((u) => (
                            <option key={u} value={u}>{u === 'DAYS' ? 'Days' : 'Months'}</option>
                          ))}
                        </select>
                      </div>
                      {rowErr.duration && (
                        <p className="mt-1 text-xs text-red-500">{rowErr.duration}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={p.basePrice}
                        onChange={(e) => setPricingRow(p._key, 'basePrice', e.target.value)}
                        placeholder="0.00"
                        className={`w-28 px-2 py-1.5 text-sm rounded-md border bg-white focus:outline-none focus:ring-2 transition-colors ${inputBorder(!!rowErr.basePrice)}`}
                        aria-invalid={rowErr.basePrice ? 'true' : 'false'}
                      />
                      {rowErr.basePrice && (
                        <p className="mt-1 text-xs text-red-500">{rowErr.basePrice}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={p.discountPercent}
                        onChange={(e) => setPricingRow(p._key, 'discountPercent', e.target.value)}
                        className="w-20 px-2 py-1.5 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="w-28 px-2 py-1.5 text-sm rounded-md border border-slate-200 bg-slate-50 text-slate-700 font-medium">
                        {p.finalPrice || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="text"
                        value={p.discountLabel}
                        onChange={(e) => setPricingRow(p._key, 'discountLabel', e.target.value)}
                        placeholder="e.g. Save 10%"
                        maxLength={100}
                        className="w-32 px-2 py-1.5 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="text"
                        value={p.externalPlanId}
                        onChange={(e) => setPricingRow(p._key, 'externalPlanId', e.target.value)}
                        placeholder="e.g. SUMAGOTEST_SILVER_1MONTH"
                        maxLength={100}
                        autoComplete="off"
                        spellCheck={false}
                        className={`w-56 px-2 py-1.5 text-sm rounded-md border bg-white focus:outline-none focus:ring-2 transition-colors ${inputBorder(!!rowErr.planId)}`}
                        aria-invalid={rowErr.planId ? 'true' : 'false'}
                      />
                      {rowErr.planId && (
                        <p className="mt-1 text-xs text-red-500">{rowErr.planId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <select
                        value={p.status}
                        onChange={(e) => setPricingRow(p._key, 'status', e.target.value)}
                        className="px-2 py-1.5 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => removePricingRow(p._key)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                        title="Remove pricing row"
                        aria-label="Remove pricing row"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between gap-3 mt-3 px-4">
            <Button variant="secondary" onClick={addPricingRow}>
              + Add Pricing
            </Button>
            {formErrors.pricingsGeneral && (
              <p className="text-xs text-red-500">{formErrors.pricingsGeneral}</p>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-3 px-4">
            Add a row per duration and choose its unit (Days or Months). Each Plan ID must be unique within
            this plan. Every row must be fully filled in (Duration, Base Price, Plan ID) — or removed with the
            trash icon — before you can save.{isEdit ? ' Each saved row is created or updated (upserted).' : ''}
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
