import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminEnrollmentService } from '../../services/adminEnrollmentService';
import { internalPlansService } from '../../services/internalPlansService';
import { courseService } from '../../services/courseService';
import { calculate as calculateFee } from '../../services/feeCalculationService';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Textarea,
  Badge,
} from '../../components/admin';

/* ─── Maps matching EnrollModal ─────────────────────────────────────────── */
const ROLE_MAP = {
  'Student':              'STUDENT',
  'Fresh Graduate':       'FRESH_GRADUATE',
  'Working Professional': 'WORKING_PROFESSIONAL',
  'Career Switcher':      'CAREER_SWITCHER',
};

const EDUCATION_MAP = {
  'School':        'SCHOOL',
  'Jr College':    'JR_COLLEGE',
  'Undergraduate': 'UNDERGRADUATE',
  'Graduate':      'GRADUATE',
  'Post Graduate': 'POST_GRADUATE',
  'Doctorate':     'DOCTORATE',
  'Other':         'OTHER',
};

const READINESS_MAP = {
  'Beginner':             'BEGINNER',
  'Intermediate':         'INTERMEDIATE',
  'Ready for Interview':  'READY_FOR_INTERVIEW',
};

const SOURCE_MAP = {
  'Social Media':       'SOCIAL_MEDIA',
  'College / University': 'COLLEGE',
  'Friend / Colleague': 'FRIEND',
  'Google Search':      'GOOGLE',
  'Other':              'OTHER',
};

const DURATION_LABELS = {
  '1_MONTH':   '1 Month',
  '3_MONTHS':  '3 Months',
  '6_MONTHS':  '6 Months',
  '12_MONTHS': '12 Months',
};

// Compat shim — remove when backend is updated to accept internalPlanId natively.
const DURATION_TO_MONTHS = {
  '1_MONTH':   1,
  '3_MONTHS':  3,
  '6_MONTHS':  6,
  '12_MONTHS': 12,
};

/* ─── Pill selector ─────────────────────────────────────────────────────── */
function Pill({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
        selected
          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
      }`}
    >
      {label}
    </button>
  );
}

/* ─── Card selector for readiness ───────────────────────────────────────── */
function OptionCard({ label, sub, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center text-xs font-semibold transition-all duration-150 ${
        selected
          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
      }`}
    >
      <span className="font-semibold">{label}</span>
      {sub && <span className={`font-normal ${selected ? 'text-emerald-100' : 'text-slate-400'}`}>{sub}</span>}
    </button>
  );
}

/* ─── Step definitions ───────────────────────────────────────────────────── */
const STEPS = [
  { title: 'About Student',  subtitle: 'Enter the student details' },
  { title: 'Choose Plan',    subtitle: 'Select course, internal plan, and coupon' },
  { title: 'Review & Submit', subtitle: 'Confirm and create the enrollment' },
];

/* ─── Currency helper ───────────────────────────────────────────────────── */
const inr = (amount) =>
  `Rs.${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/* ─── Initial form state ─────────────────────────────────────────────────── */
const EMPTY = {
  name:       '',
  email:      '',
  phone:      '',
  role:       '',
  education:  '',
  readiness:  '',
  source:     '',
  notes:      '',
};

/* ─── Validation ─────────────────────────────────────────────────────────── */
function validateStep0(data) {
  const e = {};
  const name = data.name.trim();
  if (!name) e.name = 'Full name is required';
  else if (name.length < 2) e.name = 'Name must be at least 2 characters';
  else if (name.length > 200) e.name = 'Name must be at most 200 characters';

  if (!data.email.trim()) e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email address';

  if (!data.phone.trim()) e.phone = 'Phone number is required';
  else if (!/^\d{10}$/.test(data.phone)) e.phone = 'Enter a valid 10-digit phone number';

  if (!data.role) e.role = 'Please select a role';

  if (data.notes && data.notes.length > 500) e.notes = 'Notes must be at most 500 characters';

  return e;
}

function validateStep1({ courseId, internalPlanId }) {
  const e = {};
  if (!courseId) e._course = 'Please select a course';
  if (!internalPlanId) e._plan = 'Please select an internal plan';
  return e;
}

/* ─── Step indicator pill ─────────────────────────────────────────────── */
function StepIndicator({ number, label, sublabel, complete, active }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
          complete
            ? 'bg-emerald-600 text-white'
            : active
            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
            : 'bg-slate-200 text-slate-500'
        }`}
      >
        {complete ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </div>
      <div className="hidden sm:block">
        <div className={`text-xs font-semibold ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</div>
        <div className="text-[10px] text-slate-400">{sublabel}</div>
      </div>
    </div>
  );
}

/* ─── Section label with numbered chip ─────────────────────────────────── */
function SectionLabel({ n, title, hint, status }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
          status === 'done'
            ? 'bg-emerald-100 text-emerald-700'
            : status === 'active'
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-100 text-slate-400'
        }`}
      >
        {status === 'done' ? '✓' : n}
      </span>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {hint && <span className="text-xs text-slate-400 ml-1">{hint}</span>}
    </div>
  );
}

/* ─── Course chip ──────────────────────────────────────────────────────── */
function CourseChip({ course, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
        selected
          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
          : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
      }`}
    >
      <svg
        className={`w-4 h-4 ${selected ? 'text-white' : 'text-slate-400'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <span>
        {course.nameOfCourseAsGroup}
        {course.duration?.label && (
          <span className={`ml-1.5 text-xs ${selected ? 'text-white/80' : 'text-slate-400'}`}>
            · {course.duration.label}
          </span>
        )}
      </span>
    </button>
  );
}

/* ─── Plan card (selectable) ───────────────────────────────────────────── */
function PlanCard({ plan, coursePrice, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-xl border-2 p-4 transition-all duration-150 ${
        selected
          ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
          : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold truncate ${selected ? 'text-emerald-800' : 'text-slate-800'}`}>
            {plan.name}
          </h4>
          <Badge variant={selected ? 'success' : 'info'}>
            {DURATION_LABELS[plan.duration] ?? plan.duration}
          </Badge>
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
      <div className={`text-xl font-bold ${selected ? 'text-emerald-700' : 'text-slate-900'}`}>
        {coursePrice != null ? inr(coursePrice) : '—'}
      </div>
      {plan.description && (
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>
      )}
      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
        {(plan.coupons ?? []).filter((c) => c.status === 'ACTIVE').length > 0 && (
          <span className="inline-flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {(plan.coupons ?? []).filter((c) => c.status === 'ACTIVE').length} coupon{(plan.coupons ?? []).filter((c) => c.status === 'ACTIVE').length === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </button>
  );
}

/* ─── Coupon chip ──────────────────────────────────────────────────────── */
function CouponChip({ coupon, selected, onClick, label, hint }) {
  const isNone = coupon == null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-0.5 px-3 py-2 rounded-lg border text-left transition-all duration-150 min-w-[120px] ${
        selected
          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
          : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
      } ${isNone ? 'border-dashed' : ''}`}
    >
      <span className="text-xs font-bold tracking-wide">
        {label}
      </span>
      <span className={`text-[10px] ${selected ? 'text-emerald-100' : 'text-slate-400'}`}>
        {hint}
      </span>
    </button>
  );
}

/* ─── Sticky fee summary ───────────────────────────────────────────────── */
function FeeSummaryCard({ feeBreakdown, loading, selectedPlan, coursePrice, selectedCouponCode }) {
  if (!selectedPlan) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 text-center">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">Fee Summary</div>
        <p className="text-xs text-slate-400">Pick a plan to see the price breakdown.</p>
      </div>
    );
  }

  const base   = feeBreakdown?.basePrice   ?? coursePrice ?? 0;
  const disc   = feeBreakdown?.discount    ?? 0;
  const final  = feeBreakdown?.finalAmount ?? coursePrice ?? 0;
  const savedPercent = base > 0 && disc > 0 ? Math.round((disc / base) * 100) : 0;

  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">Fee Summary</div>
        {loading && (
          <svg className="w-3.5 h-3.5 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="4" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
        )}
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-600">Base Price</dt>
          <dd className="font-medium text-slate-800">{inr(base)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-600">
            Discount {selectedCouponCode && <span className="text-[10px] text-emerald-600">({selectedCouponCode})</span>}
          </dt>
          <dd className={`font-medium ${disc > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
            {disc > 0 ? `− ${inr(disc)}` : '—'}
          </dd>
        </div>
        <div className="border-t border-emerald-200 my-2" />
        <div className="flex justify-between items-baseline">
          <dt className="text-sm font-semibold text-slate-800">Final Payable</dt>
          <dd className="text-xl font-bold text-emerald-700">{inr(final)}</dd>
        </div>
        {savedPercent > 0 && (
          <div className="text-[11px] text-emerald-600 text-right">
            You save {savedPercent}%
          </div>
        )}
      </dl>

      {feeBreakdown?.couponValid === false && selectedCouponCode && (
        <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          Coupon not applied: {feeBreakdown.couponReason}
        </p>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function AdminEnrollmentForm() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [data, setData] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* ── Plan state ── */
  const [courseList, setCourseList]               = useState([]);
  const [coursesLoading, setCoursesLoading]       = useState(true);
  const [selectedCourseId, setSelectedCourseId]   = useState('');
  const [plansForCourse, setPlansForCourse]       = useState([]);
  const [plansLoading, setPlansLoading]           = useState(false);
  const [selectedPlanId, setSelectedPlanId]       = useState('');
  const [selectedCouponCode, setSelectedCouponCode] = useState('');
  const [feeBreakdown, setFeeBreakdown]           = useState(null);
  const [feeCalculating, setFeeCalculating]       = useState(false);

  /* ── Success state ── */
  const [result, setResult] = useState(null);

  /* ── Load courses on mount ── */
  useEffect(() => {
    courseService.list({ limit: 100, status: 'ACTIVE' })
      .then(({ courses }) => setCourseList(courses ?? []))
      .catch(() => setCourseList([]))
      .finally(() => setCoursesLoading(false));
  }, []);

  /* ── Load plans for the selected course ── */
  useEffect(() => {
    if (!selectedCourseId) {
      setPlansForCourse([]);
      setSelectedPlanId('');
      setSelectedCouponCode('');
      setFeeBreakdown(null);
      return;
    }
    setPlansLoading(true);
    internalPlansService.listByCourse(selectedCourseId)
      .then((rows) => setPlansForCourse(rows ?? []))
      .catch(() => setPlansForCourse([]))
      .finally(() => setPlansLoading(false));
  }, [selectedCourseId]);

  const selectedPlan      = useMemo(
    () => plansForCourse.find((p) => String(p.id) === String(selectedPlanId)) ?? null,
    [plansForCourse, selectedPlanId],
  );
  const selectedCourse    = useMemo(
    () => courseList.find((c) => String(c.id) === String(selectedCourseId)) ?? null,
    [courseList, selectedCourseId],
  );
  const coursePrice       = selectedCourse?.courseFee != null ? Number(selectedCourse.courseFee) : null;
  const availableCoupons  = (selectedPlan?.coupons ?? []).filter((c) => c.status === 'ACTIVE');

  /* ── Recalculate fees when plan/coupon/course price changes ── */
  useEffect(() => {
    if (!selectedPlanId || coursePrice == null) {
      setFeeBreakdown(null);
      return;
    }
    let cancelled = false;
    setFeeCalculating(true);
    calculateFee({
      internalPlanId: Number(selectedPlanId),
      basePrice:      coursePrice,
      couponCode:     selectedCouponCode || undefined,
    })
      .then((res) => { if (!cancelled) setFeeBreakdown(res); })
      .catch(() => { if (!cancelled) setFeeBreakdown(null); })
      .finally(() => { if (!cancelled) setFeeCalculating(false); });
    return () => { cancelled = true; };
  }, [selectedPlanId, selectedCouponCode, coursePrice]);

  const set = (key, val) => setData((prev) => ({ ...prev, [key]: val }));

  /* ── Navigation ── */
  const goNext = () => {
    if (step === 0) {
      const e = validateStep0(data);
      if (Object.keys(e).length > 0) { setErrors(e); return; }
      setErrors({});
      setStep(1);
    } else if (step === 1) {
      const e = validateStep1({ courseId: selectedCourseId, internalPlanId: selectedPlanId });
      if (Object.keys(e).length > 0) { setErrors(e); return; }
      setErrors({});
      setStep(2);
    }
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    const e0 = validateStep0(data);
    const e1 = validateStep1({ courseId: selectedCourseId, internalPlanId: selectedPlanId });
    const allErrors = { ...e0, ...e1 };
    if (Object.keys(allErrors).length > 0) {
      toast.error('Please fix validation errors before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        name:      data.name.trim(),
        email:     data.email.trim(),
        phone:     data.phone.trim(),
        role:      ROLE_MAP[data.role],
        candidateType:      'INTERNAL',
        courseId:           Number(selectedCourseId),
        internalPlanId:     Number(selectedPlanId),
        ...(selectedPlan?.refId ? { internalPlanRefId: selectedPlan.refId } : {}),
        ...(selectedCouponCode ? { internalCouponCode: selectedCouponCode } : {}),
        ...(feeBreakdown
          ? {
              internalFeeBreakdown: {
                basePrice:   feeBreakdown.basePrice,
                discount:    feeBreakdown.discount,
                finalAmount: feeBreakdown.finalAmount,
              },
            }
          : {}),
        ...(data.education ? { education: EDUCATION_MAP[data.education] } : {}),
        ...(data.readiness ? { readiness: READINESS_MAP[data.readiness] } : {}),
        ...(data.source    ? { source: SOURCE_MAP[data.source] }          : {}),
        ...(data.notes.trim() ? { notes: data.notes.trim() } : {}),
        // Compat shim — remove when backend is updated to accept internalPlanId natively.
        planTier:       'GOLD',
        durationMonths: DURATION_TO_MONTHS[selectedPlan?.duration] ?? 6,
      };

      const resp = await adminEnrollmentService.createManual(body);
      setResult(resp);
    } catch (err) {
      if (err.details) console.error('[AdminEnrollmentForm] API validation details:', err.details);
      const detailMsg =
        Array.isArray(err.details) && err.details.length > 0
          ? err.details.map((d) => `${d.field ?? ''}: ${d.message ?? d}`).join('; ')
          : null;
      toast.error(
        detailMsg
          ? `Validation failed — ${detailMsg}`
          : (err.message ?? 'Failed to create enrollment. Please try again.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAnother = () => {
    setStep(0);
    setData(EMPTY);
    setErrors({});
    setSelectedCourseId('');
    setSelectedPlanId('');
    setSelectedCouponCode('');
    setFeeBreakdown(null);
    setResult(null);
  };

  /* ── Success screen ────────────────────────────────────────────────────── */
  if (result) {
    const { enrollment, webhookDelivery } = result;
    const webhookOk = webhookDelivery?.ok === true;

    return (
      <div className="space-y-6">
        <PageHeader
          title="Enrollment Created"
          subtitle="The enrollment was created successfully."
        />
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
                  <Badge variant={enrollment?.status === 'ACTIVE' ? 'success' : 'info'}>
                    {enrollment?.status ?? 'NEW'}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-slate-500">Amount</span>
                <div className="mt-0.5 font-semibold text-slate-800">
                  {feeBreakdown
                    ? inr(feeBreakdown.finalAmount)
                    : enrollment?.amount != null ? inr(enrollment.amount / 100) : '—'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs text-slate-500">Webhook delivery:</span>
              {webhookOk ? (
                <Badge variant="success">Delivered ({webhookDelivery?.status ?? 200}) — {webhookDelivery?.durationMs ?? 0}ms</Badge>
              ) : (
                <Badge variant="warning">
                  {webhookDelivery?.error ? `Failed: ${webhookDelivery.error}` : 'Not delivered'}
                </Badge>
              )}
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <Button variant="secondary" onClick={() => navigate('/admin/enrollments')}>
                View Enrollments
              </Button>
              <Button variant="primary" onClick={handleCreateAnother}>
                Create Another
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  /* ── Section status helpers (progressive disclosure) ── */
  const courseStatus  = selectedCourseId ? 'done' : 'active';
  const planStatus    = !selectedCourseId ? 'pending' : selectedPlanId ? 'done' : 'active';
  const couponStatus  = !selectedPlanId ? 'pending' : 'active';

  /* ── Form ──────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Enrollment"
        subtitle="Manually create a student enrollment and fire the webhook"
      />

      {/* Step nav */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <StepIndicator
              number={i + 1}
              label={s.title}
              sublabel={s.subtitle}
              complete={i < step}
              active={i === step}
            />
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 transition-colors duration-200 ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: About Student ── */}
      {step === 0 && (
        <Card>
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                value={data.name}
                placeholder="e.g. Priya Sharma"
                onChange={(e) => { set('name', e.target.value); setErrors((prev) => ({ ...prev, name: '' })); }}
                error={errors.name}
              />
              <Input
                label="Email"
                required
                type="email"
                value={data.email}
                placeholder="you@email.com"
                onChange={(e) => { set('email', e.target.value); setErrors((prev) => ({ ...prev, email: '' })); }}
                error={errors.email}
              />
            </div>

            <Input
              label="Phone"
              required
              type="tel"
              value={data.phone}
              placeholder="9876543210"
              maxLength={10}
              onChange={(e) => { set('phone', e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors((prev) => ({ ...prev, phone: '' })); }}
              error={errors.phone}
            />

            <div>
              <p className="block text-xs font-semibold text-slate-700 mb-2">
                Role <span className="text-red-500">*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(ROLE_MAP).map((r) => (
                  <Pill
                    key={r}
                    label={r}
                    selected={data.role === r}
                    onClick={() => { set('role', r); setErrors((prev) => ({ ...prev, role: '' })); }}
                  />
                ))}
              </div>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
            </div>

            <div>
              <p className="block text-xs font-semibold text-slate-700 mb-2">Education Level</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(EDUCATION_MAP).map((ed) => (
                  <Pill
                    key={ed}
                    label={ed}
                    selected={data.education === ed}
                    onClick={() => set('education', ed)}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="block text-xs font-semibold text-slate-700 mb-2">Placement Readiness</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Beginner',            sub: 'Just starting out' },
                  { label: 'Intermediate',         sub: 'Some experience' },
                  { label: 'Ready for Interview',  sub: 'Job-ready' },
                ].map((r) => (
                  <OptionCard
                    key={r.label}
                    label={r.label}
                    sub={r.sub}
                    selected={data.readiness === r.label}
                    onClick={() => set('readiness', r.label)}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="block text-xs font-semibold text-slate-700 mb-2">Source</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(SOURCE_MAP).map((s) => (
                  <Pill
                    key={s}
                    label={s}
                    selected={data.source === s}
                    onClick={() => set('source', s)}
                  />
                ))}
              </div>
            </div>

            <Textarea
              label="Admin Notes"
              value={data.notes}
              placeholder="Optional notes visible only to admins (max 500 chars)"
              rows={3}
              maxLength={500}
              onChange={(e) => { set('notes', e.target.value); setErrors((prev) => ({ ...prev, notes: '' })); }}
              error={errors.notes}
              hint={`${data.notes.length}/500`}
            />
          </div>
        </Card>
      )}

      {/* ── Step 1: Choose Plan (progressive disclosure) ── */}
      {step === 1 && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* LEFT: main flow */}
          <div className="lg:col-span-2 space-y-5">

            {/* Section 1: Course */}
            <Card>
              <div className="space-y-3">
                <SectionLabel n="1" title="Course" hint="Required" status={courseStatus} />
                {coursesLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading courses...</div>
                ) : courseList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No active courses found. Create one in Courses Master first.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {courseList.map((c) => (
                      <CourseChip
                        key={c.id}
                        course={c}
                        selected={String(c.id) === String(selectedCourseId)}
                        onClick={() => {
                          setSelectedCourseId(String(c.id));
                          setErrors((prev) => ({ ...prev, _course: '' }));
                        }}
                      />
                    ))}
                  </div>
                )}
                {errors._course && <p className="text-red-500 text-xs">{errors._course}</p>}
              </div>
            </Card>

            {/* Section 2: Plan */}
            <Card>
              <div className="space-y-3">
                <SectionLabel
                  n="2"
                  title="Internal Plan"
                  hint={selectedCourseId ? 'Required' : 'Pick a course first'}
                  status={planStatus}
                />
                {!selectedCourseId ? (
                  <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    Pick a course above to see available internal plans.
                  </div>
                ) : plansLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading plans...</div>
                ) : plansForCourse.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-amber-200 bg-amber-50 rounded-xl">
                    <p className="font-medium text-amber-800 mb-1">No active internal plans for this course.</p>
                    <p>Create a plan from the Internal Plans page first.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {plansForCourse.map((p) => (
                      <PlanCard
                        key={p.id}
                        plan={p}
                        coursePrice={coursePrice}
                        selected={String(p.id) === String(selectedPlanId)}
                        onSelect={() => {
                          setSelectedPlanId(String(p.id));
                          setSelectedCouponCode('');
                          setErrors((prev) => ({ ...prev, _plan: '' }));
                        }}
                      />
                    ))}
                  </div>
                )}
                {errors._plan && <p className="text-red-500 text-xs">{errors._plan}</p>}
              </div>
            </Card>

            {/* Section 3: Coupon */}
            <Card>
              <div className="space-y-3">
                <SectionLabel
                  n="3"
                  title="Coupon"
                  hint={!selectedPlanId ? 'Pick a plan first' : 'Optional'}
                  status={couponStatus}
                />
                {!selectedPlanId ? (
                  <div className="py-6 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    Pick a plan above to see eligible coupons.
                  </div>
                ) : availableCoupons.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No coupons available for this plan.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <CouponChip
                      coupon={null}
                      label="No coupon"
                      hint="Pay full price"
                      selected={!selectedCouponCode}
                      onClick={() => setSelectedCouponCode('')}
                    />
                    {availableCoupons.map((c) => (
                      <CouponChip
                        key={c.id}
                        coupon={c}
                        label={c.code}
                        hint={
                          c.discountType === 'PERCENT'
                            ? `${c.discountValue}% off`
                            : `${inr(c.discountValue)} off`
                        }
                        selected={selectedCouponCode === c.code}
                        onClick={() => setSelectedCouponCode(c.code)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT: sticky fee summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <FeeSummaryCard
                feeBreakdown={feeBreakdown}
                loading={feeCalculating}
                selectedPlan={selectedPlan}
                coursePrice={coursePrice}
                selectedCouponCode={selectedCouponCode}
              />

              {selectedCourse && selectedPlan && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                  <div className="text-slate-400 mb-1 uppercase tracking-wider text-[10px] font-semibold">Selection</div>
                  <p className="text-slate-700">
                    <span className="font-medium">{selectedCourse.nameOfCourseAsGroup}</span>
                    <br />
                    <span className="text-slate-500">{selectedPlan.name}</span>
                    <br />
                    <span className="text-slate-400">{DURATION_LABELS[selectedPlan.duration] ?? selectedPlan.duration}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Review ── */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Student Details</h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Name',      data.name],
                ['Email',     data.email],
                ['Phone',     data.phone],
                ['Role',      data.role],
                ['Education', data.education || '—'],
                ['Readiness', data.readiness || '—'],
                ['Source',    data.source    || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-slate-400">{k}</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">{v}</dd>
                </div>
              ))}
              {data.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-400">Notes</dt>
                  <dd className="font-medium text-slate-800 mt-0.5 whitespace-pre-wrap">{data.notes}</dd>
                </div>
              )}
            </dl>
          </Card>

          {selectedPlan && feeBreakdown && (
            <Card>
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Plan & Pricing</h2>
              {/* Minimal preview only — the full breakdown (sections,
                  payment history, status pills) lives on the Enrollment
                  Details drawer reachable from the Enrollments list. */}
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ['Course',        selectedCourse?.nameOfCourseAsGroup ?? '—'],
                  ['Plan',          selectedPlan.name],
                  ['Duration',      DURATION_LABELS[selectedPlan.duration] ?? selectedPlan.duration],
                  ['Base Price',    inr(feeBreakdown.basePrice)],
                  ['Coupon',        selectedCouponCode || '—'],
                  ['Discount',      feeBreakdown.discount > 0 ? `− ${inr(feeBreakdown.discount)}` : '—'],
                  ['Final Payable', inr(feeBreakdown.finalAmount)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-slate-400">{k}</dt>
                    <dd className={`font-medium mt-0.5 ${k === 'Final Payable' ? 'text-emerald-700 text-base font-bold' : 'text-slate-800'}`}>{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {errors._api && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {errors._api}
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            loading={submitting}
            className="w-full sm:w-auto"
            onClick={handleSubmit}
          >
            Create Enrollment & Fire Webhook
          </Button>
        </div>
      )}

      {/* ── Footer nav ── */}
      <div className="flex items-center justify-between gap-3 pt-2 pb-4">
        {step > 0 ? (
          <Button variant="secondary" onClick={goBack} disabled={submitting}>
            Back
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => navigate('/admin/enrollments')}>
            Cancel
          </Button>
        )}

        {step < 2 && (
          <Button variant="primary" onClick={goNext} disabled={submitting}>
            {step === 0 ? 'Next: Choose Plan' : 'Next: Review'}
          </Button>
        )}
      </div>
    </div>
  );
}
