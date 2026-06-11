import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminEnrollmentService } from '../../services/adminEnrollmentService';
import { internalPlansService } from '../../services/internalPlansService';
import { courseService } from '../../services/courseService';
import { calculate as calculateFee } from '../../services/feeCalculationService';
import { internalDurationLabel } from '../../utils/internalPlanDuration';
import { sanitizeEmail, validateEmail } from '../../services/validation';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Badge,
  Loader,
} from '../../components/admin';

/* ─── Enum → human label maps (for read-only review display) ─────────────── */
const ROLE_LABELS = {
  STUDENT:              'Student',
  FRESH_GRADUATE:       'Fresh Graduate',
  WORKING_PROFESSIONAL: 'Working Professional',
  CAREER_SWITCHER:      'Career Switcher',
};
const EDUCATION_LABELS = {
  SCHOOL: 'School', JR_COLLEGE: 'Jr College', UNDERGRADUATE: 'Undergraduate',
  GRADUATE: 'Graduate', POST_GRADUATE: 'Post Graduate', DOCTORATE: 'Doctorate', OTHER: 'Other',
};
const READINESS_LABELS = {
  BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', READY_FOR_INTERVIEW: 'Ready for Interview',
};
const SOURCE_LABELS = {
  SOCIAL_MEDIA: 'Social Media', COLLEGE: 'College / University', FRIEND: 'Friend / Colleague',
  GOOGLE: 'Google Search', OTHER: 'Other',
};

const inr = (amount) =>
  amount == null ? '—' : `Rs.${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/* ─── Step indicator ─────────────────────────────────────────────────────── */
function StepDot({ n, label, active, done }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
          done ? 'bg-emerald-600 text-white' : active ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-slate-200 text-slate-500'
        }`}
      >
        {done ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : n}
      </div>
      <span className={`text-xs font-semibold ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}

/* ─── Read-only review field ─────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800 mt-0.5">{children || '—'}</dd>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function AdminRenewalEnrollment() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  /* ── Step 0: find student ── */
  const [email, setEmail]         = useState('');
  const [emailError, setEmailError] = useState('');
  const [fetching, setFetching]   = useState(false);

  /* ── Fetched record ── */
  const [src, setSrc]             = useState(null);   // full getById result
  const [prevRow, setPrevRow]     = useState(null);   // compact history row (plan window etc.)

  /* ── Course + plan (seeded from the previous enrollment) ── */
  const [courseOptions, setCourseOptions]     = useState([]);
  // Fallback course picker — only used when the previous enrollment has no
  // internal plan/course to seed from.
  const [selectedCourseId, setSelectedCourseId] = useState('');
  // Aggregated list of selectable plans. Each entry is annotated with the
  // course offering it belongs to: _courseId, _courseFee, _courseDuration.
  const [planList, setPlanList]               = useState([]);
  const [plansLoading, setPlansLoading]       = useState(false);
  const [selectedPlanId, setSelectedPlanId]   = useState('');
  const [feeBreakdown, setFeeBreakdown]       = useState(null);
  const [feeCalculating, setFeeCalculating]   = useState(false);

  /* ── Submit / success ── */
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);

  /* ── Load courses once (for fee lookup + fallback course picker) ── */
  useEffect(() => {
    courseService.list({ limit: 100, status: 'ACTIVE' })
      .then(({ courses }) => setCourseOptions(courses ?? []))
      .catch(() => setCourseOptions([]));
  }, []);

  /* ── The course NAME being renewed (a course can exist as several offerings,
        e.g. "UI UX" with different durations — each is its own CourseMaster). ── */
  const courseName = src?.internalPlan?.course?.name
    ?? courseOptions.find((c) => String(c.id) === String(selectedCourseId))?.nameOfCourseAsGroup
    ?? '';

  /* ── Load every ACTIVE internal plan available for this course name,
        across ALL of its offerings (durations). Each plan is tagged with the
        offering it belongs to so the fee + submit use the right course id.
        The previously-purchased plan is always included even if deactivated. ── */
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    setPlansLoading(true);

    const annotate = (rows, courseId, courseFee, courseDuration) =>
      (rows ?? []).map((p) => ({
        ...p, _courseId: courseId, _courseFee: courseFee, _courseDuration: courseDuration,
      }));

    const run = async () => {
      let group = [];
      if (src.internalPlan?.course?.id) {
        // Mode A — renew an existing internal course: gather every offering
        // sharing the course name (fall back to just the previous offering).
        const matches = courseName
          ? courseOptions.filter((c) => c.nameOfCourseAsGroup === courseName)
          : [];
        group = matches.length
          ? matches.map((c) => ({ id: c.id, fee: Number(c.courseFee), dur: c.duration?.label ?? null }))
          : [{
              id: src.internalPlan.course.id,
              fee: src.internalPlan.course.fee != null ? Number(src.internalPlan.course.fee) : null,
              dur: src.internalPlan.durationLabel ?? null,
            }];
      } else if (selectedCourseId) {
        // Mode B — fallback: previous record had no internal course, admin picked one.
        const c = courseOptions.find((x) => String(x.id) === String(selectedCourseId));
        group = [{ id: Number(selectedCourseId), fee: c ? Number(c.courseFee) : null, dur: c?.duration?.label ?? null }];
      }

      const results = await Promise.all(
        group.map((g) =>
          internalPlansService.listByCourse(g.id)
            .then((rows) => annotate(rows, g.id, g.fee, g.dur))
            .catch(() => []),
        ),
      );
      let flat = results.flat();

      // Guarantee the previously-purchased plan is present (it may be inactive).
      const prev = src.internalPlan;
      if (prev?.id && !flat.some((p) => String(p.id) === String(prev.id))) {
        flat.unshift({
          id: prev.id, name: prev.name, duration: prev.duration, externalPlanId: prev.externalPlanId,
          _courseId: prev.course?.id, _courseFee: prev.course?.fee != null ? Number(prev.course.fee) : null,
          _courseDuration: prev.durationLabel ?? null,
        });
      }
      if (!cancelled) setPlanList(flat);
    };

    run().finally(() => { if (!cancelled) setPlansLoading(false); });
    return () => { cancelled = true; };
  }, [src, courseOptions, selectedCourseId, courseName]);

  const selectedPlan = useMemo(
    () => planList.find((p) => String(p.id) === String(selectedPlanId)) ?? null,
    [planList, selectedPlanId],
  );

  // Course id + base price follow the selected plan's offering.
  const effectiveCourseId = selectedPlan?._courseId
    ?? src?.internalPlan?.course?.id
    ?? (selectedCourseId ? Number(selectedCourseId) : null);
  const coursePrice = selectedPlan?._courseFee
    ?? (src?.internalPlan?.course?.fee != null ? Number(src.internalPlan.course.fee) : null);

  /* ── Recalculate fee when plan / price changes ── */
  useEffect(() => {
    if (!selectedPlanId || coursePrice == null) { setFeeBreakdown(null); return; }
    let cancelled = false;
    setFeeCalculating(true);
    calculateFee({ internalPlanId: Number(selectedPlanId), basePrice: coursePrice })
      .then((res) => { if (!cancelled) setFeeBreakdown(res); })
      .catch(() => { if (!cancelled) setFeeBreakdown(null); })
      .finally(() => { if (!cancelled) setFeeCalculating(false); });
    return () => { cancelled = true; };
  }, [selectedPlanId, coursePrice]);

  /* ── Step 0 → fetch the latest enrollment for this email ── */
  const handleFetch = async () => {
    const em = email.trim();
    const err = validateEmail(em);
    if (err) { setEmailError(err); return; }
    setEmailError('');
    setFetching(true);
    try {
      const { total, latest } = await adminEnrollmentService.findLatestByEmail(em);
      if (!total || !latest) {
        setEmailError('No enrollment found for this email address.');
        return;
      }
      const full = await adminEnrollmentService.getById(latest.id);
      setSrc(full);
      setPrevRow(latest);
      const prevCourseId = full.internalPlan?.course?.id;
      setSelectedCourseId(prevCourseId != null ? String(prevCourseId) : '');
      setSelectedPlanId(full.internalPlan?.id != null ? String(full.internalPlan.id) : '');
      setStep(1);
    } catch (e) {
      setEmailError(e.message ?? 'Failed to fetch enrollment details.');
    } finally {
      setFetching(false);
    }
  };

  /* ── Submit the renewal ── */
  const handleSubmit = async () => {
    if (!src) return;
    if (!selectedPlanId)    { toast.error('Please select an internal plan for the renewal.'); return; }
    if (!effectiveCourseId) { toast.error('Could not resolve the course for the selected plan.'); return; }

    setSubmitting(true);
    try {
      const body = {
        name:  src.fullName,
        email: src.email,
        phone: src.phone,
        role:  src.role,
        ...(src.education ? { education: src.education } : {}),
        ...(src.readiness ? { readiness: src.readiness } : {}),
        ...(src.source    ? { source: src.source }       : {}),
        courseId:       Number(effectiveCourseId),
        internalPlanId: Number(selectedPlanId),
        notes: `Renewal of enrollment ${src.enrollmentId ?? src.id}`,
      };
      const resp = await adminEnrollmentService.createInternal(body);
      setResult(resp);
    } catch (err) {
      const detailMsg =
        Array.isArray(err.details) && err.details.length > 0
          ? err.details.map((d) => `${d.field ?? ''}: ${d.message ?? d}`).join('; ')
          : null;
      toast.error(detailMsg ? `Validation failed — ${detailMsg}` : (err.message ?? 'Failed to create renewal.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenewAnother = () => {
    setStep(0);
    setEmail('');
    setEmailError('');
    setSrc(null);
    setPrevRow(null);
    setSelectedCourseId('');
    setSelectedPlanId('');
    setFeeBreakdown(null);
    setResult(null);
  };

  /* ── Success screen ── */
  if (result) {
    const { enrollment, webhookDelivery } = result;
    const webhookOk = webhookDelivery?.ok === true;
    return (
      <div className="space-y-6">
        <PageHeader title="Renewal Created" subtitle="The renewal enrollment was created successfully." />
        <Card className="max-w-xl">
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Enrollment Code</p>
              <p className="text-2xl font-bold font-mono text-slate-900">{enrollment?.enrollmentCode ?? enrollment?.id}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left text-xs rounded-lg border border-slate-200 p-3 bg-slate-50">
              <div>
                <span className="text-slate-500">Status</span>
                <div className="mt-0.5">
                  <Badge variant={enrollment?.status === 'ACTIVE' ? 'success' : 'info'}>{enrollment?.status ?? 'NEW'}</Badge>
                </div>
              </div>
              <div>
                <span className="text-slate-500">Amount</span>
                <div className="mt-0.5 font-semibold text-slate-800">
                  {feeBreakdown ? inr(feeBreakdown.finalAmount) : enrollment?.amount != null ? inr(enrollment.amount / 100) : '—'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs text-slate-500">Webhook delivery:</span>
              {webhookOk ? (
                <Badge variant="success">Delivered ({webhookDelivery?.status ?? 200}) — {webhookDelivery?.durationMs ?? 0}ms</Badge>
              ) : (
                <Badge variant="warning">{webhookDelivery?.error ? `Failed: ${webhookDelivery.error}` : 'Not delivered'}</Badge>
              )}
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="secondary" onClick={() => navigate('/admin/enrollments')}>View Enrollments</Button>
              <Button variant="primary" onClick={handleRenewAnother}>Renew Another</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="space-y-6">
      <PageHeader
        title="Renew Enrollment"
        subtitle="Re-enroll an existing student using only their registered email — no need to re-enter their details."
      />

      {/* Step nav */}
      <div className="flex items-center gap-4">
        <StepDot n={1} label="Find Student" active={step === 0} done={step > 0} />
        <div className={`flex-1 h-px ${step > 0 ? 'bg-emerald-400' : 'bg-slate-200'}`} />
        <StepDot n={2} label="Review & Renew" active={step === 1} done={false} />
      </div>

      {/* ── Step 0: Find by email ── */}
      {step === 0 && (
        <Card className="max-w-xl">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Enter the student's <span className="font-medium text-slate-800">registered email address</span>.
              We'll fetch their latest enrollment and pre-fill everything for review.
            </p>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <Input
                  label="Registered Email"
                  required
                  type="email"
                  value={email}
                  placeholder="student@email.com"
                  autoComplete="off"
                  inputMode="email"
                  spellCheck={false}
                  maxLength={255}
                  onChange={(e) => { setEmail(sanitizeEmail(e.target.value)); setEmailError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleFetch(); }}
                  error={emailError}
                />
              </div>
            </div>
            <Button variant="primary" loading={fetching} onClick={handleFetch}>
              {fetching ? 'Fetching…' : 'Fetch Latest Enrollment'}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Step 1: Review & renew ── */}
      {step === 1 && src && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">
            {/* Previous enrollment summary */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">Latest enrollment on record</h3>
                <Badge variant="info">{src.status ?? '—'}</Badge>
              </div>
              <dl className="grid sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <Field label="Enrollment Code">{src.enrollmentId ?? src.id}</Field>
                <Field label="Enrolled On">{formatDate(src.createdAt)}</Field>
                <Field label="Previous Plan">{prevRow?.planLabel ?? src.internalPlan?.name ?? '—'}</Field>
                {prevRow?.planExpiryAt && <Field label="Plan Expiry">{formatDate(prevRow.planExpiryAt)}</Field>}
                {prevRow?.daysLeft != null && <Field label="Days Left">{prevRow.daysLeft}</Field>}
              </dl>
            </Card>

            {/* Auto-filled student details (read-only) */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Student Details (auto-filled)</h3>
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="Name">{src.fullName}</Field>
                <Field label="Email">{src.email}</Field>
                <Field label="Phone">{src.phone}</Field>
                <Field label="Role">{ROLE_LABELS[src.role] ?? src.role}</Field>
                <Field label="Education">{EDUCATION_LABELS[src.education] ?? src.education}</Field>
                <Field label="Readiness">{READINESS_LABELS[src.readiness] ?? src.readiness}</Field>
                <Field label="Source">{SOURCE_LABELS[src.source] ?? src.source}</Field>
              </dl>
              <p className="text-xs text-slate-400 mt-3">
                These details are carried over from the existing record and cannot be changed here. To edit student
                information, create a regular new enrollment instead.
              </p>
            </Card>

            {/* Course + plan for the renewal */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Renewal Plan</h3>

              {src.internalPlan?.course?.id ? (
                <div className="mb-4">
                  <p className="block text-xs font-semibold text-slate-700 mb-1">Course</p>
                  <div className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                    {courseName}
                  </div>
                </div>
              ) : (
                <Select
                  label="Course"
                  required
                  value={selectedCourseId}
                  onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedPlanId(''); }}
                  className="mb-4"
                >
                  <option value="">— Select a course —</option>
                  {courseOptions.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nameOfCourseAsGroup}{c.duration?.label ? ` — ${c.duration.label}` : ''}
                    </option>
                  ))}
                </Select>
              )}

              <p className="block text-xs font-semibold text-slate-700 mb-2">
                Internal Plan <span className="text-red-500">*</span>
              </p>
              {(!src.internalPlan?.course?.id && !selectedCourseId) ? (
                <p className="text-xs text-slate-400">Select a course to choose its plan.</p>
              ) : plansLoading ? (
                <div className="py-4"><Loader size="sm" label="Loading plans…" /></div>
              ) : planList.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 border-2 border-dashed border-amber-200 bg-amber-50 rounded-xl">
                  <p className="font-medium text-amber-800 mb-1">No active internal plans for this course.</p>
                  <p>Create a plan from the Internal Plans page first.</p>
                </div>
              ) : (
                <>
                  {/* Every active plan for this course name — across all of its
                      offerings (durations) — rendered as visible cards. */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {planList.map((p) => {
                      const selected = String(p.id) === String(selectedPlanId);
                      const isPrev = src.internalPlan?.id && String(p.id) === String(src.internalPlan.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPlanId(String(p.id))}
                          className={`text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                            selected
                              ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
                              : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-semibold truncate ${selected ? 'text-emerald-800' : 'text-slate-800'}`}>
                                {p.name}
                              </h4>
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <Badge variant={selected ? 'success' : 'info'}>{internalDurationLabel(p)}</Badge>
                                {isPrev && (
                                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                    Previous
                                  </span>
                                )}
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                selected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {selected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${selected ? 'text-emerald-700' : 'text-slate-900'}`}>
                            {p._courseFee != null ? inr(p._courseFee) : '—'}
                          </div>
                          {p.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Showing every plan available for <span className="font-medium text-slate-600">{courseName}</span>.
                    Pre-selected to the previously purchased plan — pick another to upgrade/downgrade.
                  </p>
                </>
              )}
            </Card>
          </div>

          {/* RIGHT: fee summary + actions */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4 space-y-3">
              <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">Renewal Fee</div>
                  {feeCalculating && <Loader size="xs" />}
                </div>
                {!selectedPlan ? (
                  <p className="text-xs text-slate-400">Select a plan to see the price.</p>
                ) : (
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Base Price</dt>
                      <dd className="font-medium text-slate-800">{inr(feeBreakdown?.basePrice ?? coursePrice)}</dd>
                    </div>
                    <div className="border-t border-emerald-200 my-2" />
                    <div className="flex justify-between items-baseline">
                      <dt className="text-sm font-semibold text-slate-800">Final Payable</dt>
                      <dd className="text-xl font-bold text-emerald-700">{inr(feeBreakdown?.finalAmount ?? coursePrice)}</dd>
                    </div>
                  </dl>
                )}
              </div>

              {selectedPlan && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                  <div className="text-slate-400 mb-1 uppercase tracking-wider text-[10px] font-semibold">Renewing</div>
                  <p className="text-slate-700">
                    <span className="font-medium">{src.fullName}</span><br />
                    <span className="text-slate-500">{courseName}</span><br />
                    <span className="text-slate-400">{selectedPlan.name} · {internalDurationLabel(selectedPlan)}</span>
                  </p>
                </div>
              )}

              <Button
                variant="primary"
                className="w-full"
                loading={submitting}
                disabled={!selectedPlanId}
                onClick={handleSubmit}
              >
                Create Renewal & Fire Webhook
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer nav ── */}
      <div className="flex items-center justify-between gap-3 pt-2 pb-4">
        {step > 0 ? (
          <Button variant="secondary" onClick={() => { setStep(0); }} disabled={submitting}>
            Back
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => navigate('/admin/enrollments')}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
