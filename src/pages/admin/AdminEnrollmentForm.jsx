import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminEnrollmentService } from '../../services/adminEnrollmentService';
import { internalPlansService } from '../../services/internalPlansService';
import { courseService } from '../../services/courseService';
import { calculate as calculateFee } from '../../services/feeCalculationService';
import { internalDurationLabel } from '../../utils/internalPlanDuration';
import {
  sanitizeName,
  sanitizePhone,
  sanitizeEmail,
  validateName,
  validatePhone,
  validateEmail,
} from '../../services/validation';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Textarea,
  Badge,
  Loader,
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
  { title: 'Choose Plan',    subtitle: 'Select course and internal plan' },
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
  // Same validator suite used by the public website enrollment modal so
  // that admin + public flows enforce identical rules:
  //   - Full Name: letters + single spaces only (regex), 2..100 chars
  //   - Email:     local@domain.tld with TLD ≥ 2 chars
  //   - Phone:     10 digits, must START with 6, 7, 8, or 9 (TRAI mobile)
  // The sanitizers in onChange handlers already strip illegal characters
  // at keystroke time; these validators catch anything that slipped past
  // (e.g. paste from clipboard, autofill) and provide the user-facing
  // error message.
  const e = {};
  const nameErr  = validateName(data.name);
  const emailErr = validateEmail(data.email);
  const phoneErr = validatePhone(data.phone);
  if (nameErr)  e.name  = nameErr;
  if (emailErr) e.email = emailErr;
  if (phoneErr) e.phone = phoneErr;

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
/**
 * Renders the hint as a red "Required" pill when hint === 'Required',
 * matching what the user asked for: instead of a barely-visible "*" or
 * gray text, the obligation is unambiguous. Any other hint string still
 * renders as small slate text (so 'Optional', 'Pick a plan first', etc.
 * keep their existing low-emphasis treatment).
 */
function SectionLabel({ n, title, hint, status }) {
  const isRequired = hint === 'Required';
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
      {hint && (
        isRequired ? (
          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wide">
            Required
          </span>
        ) : (
          <span className="text-xs text-slate-400 ml-1">{hint}</span>
        )
      )}
    </div>
  );
}

/* ─── Duration ordering helper ─────────────────────────────────────────── */
// Parses duration labels like "30 Days", "3 Months", "1 Year" to a comparable
// day count so sibling variants render shortest → longest regardless of how
// the backend ordered them.
function durationToDays(label) {
  if (!label) return Number.MAX_SAFE_INTEGER;
  const m = String(label).match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith('day'))   return n;
  if (unit.startsWith('week'))  return n * 7;
  if (unit.startsWith('month')) return n * 30;
  if (unit.startsWith('year'))  return n * 365;
  return Number.MAX_SAFE_INTEGER;
}

/* ─── Course group card ────────────────────────────────────────────────── */
// Groups every duration variant of a single course under one header so admins
// scan by course name once, then pick a duration. Replaces the old flat chip
// list where the same course name was repeated up to ~6 times.
function CourseGroupCard({ courseName, variants, selectedCourseId, onSelect }) {
  const hasSelection = variants.some((v) => String(v.id) === String(selectedCourseId));
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        // Clicking anywhere on the card selects the course (shortest duration by
        // default). If a duration in this card is already chosen, leave it — the
        // user switches duration via the pills below.
        if (hasSelection) return;
        const id = variants[0]?.id;
        if (id != null) onSelect(id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (hasSelection) return;
          const id = variants[0]?.id;
          if (id != null) onSelect(id);
        }
      }}
      className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-150 ${
        hasSelection
          ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
          : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            hasSelection ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h4 className={`flex-1 text-sm font-semibold leading-tight ${hasSelection ? 'text-emerald-800' : 'text-slate-800'}`}>
          {courseName}
        </h4>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold shrink-0">
          {variants.length} {variants.length === 1 ? 'option' : 'options'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {variants.map((c) => {
          const selected = String(c.id) === String(selectedCourseId);
          return (
            <button
              key={c.id}
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelect(c.id); }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                selected
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {selected && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {c.duration?.label ?? 'No duration'}
            </button>
          );
        })}
      </div>
    </div>
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
            {internalDurationLabel(plan)}
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
    </button>
  );
}

/* ─── Sticky fee summary ───────────────────────────────────────────────── */
function FeeSummaryCard({ feeBreakdown, loading, selectedPlan, coursePrice }) {
  if (!selectedPlan) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 text-center">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">Fee Summary</div>
        <p className="text-xs text-slate-400">Pick a plan to see the price breakdown.</p>
      </div>
    );
  }

  const base  = feeBreakdown?.basePrice   ?? coursePrice ?? 0;
  const final = feeBreakdown?.finalAmount ?? coursePrice ?? 0;

  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">Fee Summary</div>
        {loading && (
          <Loader size="xs" />
        )}
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-600">Base Price</dt>
          <dd className="font-medium text-slate-800">{inr(base)}</dd>
        </div>
        <div className="border-t border-emerald-200 my-2" />
        <div className="flex justify-between items-baseline">
          <dt className="text-sm font-semibold text-slate-800">Final Payable</dt>
          <dd className="text-xl font-bold text-emerald-700">{inr(final)}</dd>
        </div>
      </dl>
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
  // Step-1 captured fields are auto-saved as an unpaid draft enrollment
  // so if admin closes the tab here, the lead is still tracked in
  // Follow-Ups. draftEnrollmentId is echoed back to the backend on
  // subsequent Step-1 saves (so going Back -> Next reuses the row) and
  // on the final Step-3 submit (so the backend can discard the draft
  // before creating the final paid enrollment).
  const [draftEnrollmentId, setDraftEnrollmentId] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);

  // Live "email already registered?" check. `status` is one of:
  //   'idle' | 'checking' | 'exists' | 'new' | 'error'
  // `count` is how many existing enrollments share this email.
  const [emailCheck, setEmailCheck] = useState({ status: 'idle', count: 0, currentPlan: null });

  /* ── Plan state ── */
  const [courseList, setCourseList]               = useState([]);
  const [coursesLoading, setCoursesLoading]       = useState(true);
  const [courseSearch, setCourseSearch]           = useState('');
  const [selectedCourseId, setSelectedCourseId]   = useState('');
  const [plansForCourse, setPlansForCourse]       = useState([]);
  const [plansLoading, setPlansLoading]           = useState(false);
  const [selectedPlanId, setSelectedPlanId]       = useState('');
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

  /* ── Group courses by name and filter by search ── */
  // Backend returns one row per course×duration pair, so the same name shows
  // up several times. Group them so admins see each course once with its
  // duration variants nested underneath. Search filters by course name only —
  // duration text isn't searched (admins know course names, not durations).
  const groupedCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    const groups = new Map();
    for (const c of courseList) {
      const name = c.nameOfCourseAsGroup ?? 'Untitled course';
      if (q && !name.toLowerCase().includes(q)) continue;
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(c);
    }
    // Sort variants inside each group by duration length (shortest → longest)
    // for predictable reading order regardless of backend ordering.
    for (const variants of groups.values()) {
      variants.sort((a, b) => durationToDays(a.duration?.label) - durationToDays(b.duration?.label));
    }
    return Array.from(groups.entries()).map(([name, variants]) => ({ name, variants }));
  }, [courseList, courseSearch]);

  /* ── Recalculate fees when plan / course price changes ── */
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
    })
      .then((res) => { if (!cancelled) setFeeBreakdown(res); })
      .catch(() => { if (!cancelled) setFeeBreakdown(null); })
      .finally(() => { if (!cancelled) setFeeCalculating(false); });
    return () => { cancelled = true; };
  }, [selectedPlanId, coursePrice]);

  /* ── Live duplicate-email check (debounced) ── */
  // Whenever the email is a syntactically valid address, ask the backend
  // whether it already has enrollments and surface the result immediately
  // below the field. Non-blocking: admins may legitimately create another
  // enrollment for the same student, so this only warns.
  useEffect(() => {
    const email = data.email.trim();
    // Don't probe the API until the address is well-formed.
    if (!email || validateEmail(email)) {
      setEmailCheck({ status: 'idle', count: 0, currentPlan: null });
      return;
    }

    let cancelled = false;
    setEmailCheck((prev) => ({ ...prev, status: 'checking' }));
    const t = setTimeout(() => {
      adminEnrollmentService
        .checkEmail(email)
        .then((res) => {
          if (cancelled) return;
          const count = res?.total ?? 0;
          setEmailCheck({
            status: count > 0 ? 'exists' : 'new',
            count,
            currentPlan: res?.currentPlan ?? null,
          });
        })
        .catch(() => {
          if (!cancelled) setEmailCheck({ status: 'error', count: 0, currentPlan: null });
        });
    }, 450);

    return () => { cancelled = true; clearTimeout(t); };
  }, [data.email]);

  const set = (key, val) => setData((prev) => ({ ...prev, [key]: val }));

  /* ── Navigation ── */
  const goNext = async () => {
    if (step === 0) {
      const e = validateStep0(data);
      if (Object.keys(e).length > 0) { setErrors(e); return; }
      setErrors({});

      // Auto-save Step-1 fields as an unpaid draft so the lead is
      // captured even if admin closes the tab now. Fail-soft: a draft
      // save failure does NOT block navigation - the admin can still
      // proceed and the final Step-3 submit will create the row.
      setSavingDraft(true);
      try {
        const res = await adminEnrollmentService.saveDraft({
          name:      data.name.trim(),
          email:     data.email.trim().toLowerCase(),
          phone:     data.phone.trim(),
          role:      ROLE_MAP[data.role],
          ...(data.education ? { education: EDUCATION_MAP[data.education] } : {}),
          ...(data.readiness ? { readiness: READINESS_MAP[data.readiness] } : {}),
          ...(data.source    ? { source: SOURCE_MAP[data.source] }          : {}),
          ...(data.notes.trim() ? { notes: data.notes.trim() } : {}),
          ...(draftEnrollmentId ? { draftEnrollmentId } : {}),
        });
        if (res?.enrollmentId) setDraftEnrollmentId(res.enrollmentId);
      } catch (err) {
        // Surface in console for diagnostics, do not block UX.
        console.warn('[AdminEnrollmentForm] draft save failed:', err?.message || err);
      } finally {
        setSavingDraft(false);
      }

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
      // Server-authoritative payload. We deliberately do NOT send any
      // pricing values — the backend re-resolves base / final from
      // internalPlanId + courseId and persists the snapshot. Sending fee
      // values would be misleading (validator drops them) and a tampering
      // vector.
      const body = {
        name:           data.name.trim(),
        email:          data.email.trim(),
        phone:          data.phone.trim(),
        role:           ROLE_MAP[data.role],
        courseId:       Number(selectedCourseId),
        internalPlanId: Number(selectedPlanId),
        ...(data.education ? { education: EDUCATION_MAP[data.education] } : {}),
        ...(data.readiness ? { readiness: READINESS_MAP[data.readiness] } : {}),
        ...(data.source    ? { source: SOURCE_MAP[data.source] }          : {}),
        ...(data.notes.trim() ? { notes: data.notes.trim() } : {}),
        // Tell the backend which Step-1 draft to discard. Without this,
        // the wizard would leave behind an unpaid lead row in Follow-Ups
        // even after the final paid enrollment was created.
        ...(draftEnrollmentId ? { draftEnrollmentId } : {}),
      };

      const resp = await adminEnrollmentService.createInternal(body);
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
                autoComplete="name"
                autoCapitalize="words"
                spellCheck={false}
                maxLength={100}
                showCount
                /* sanitizeName strips anything that isn't a letter or space
                   and collapses consecutive spaces, so the field can never
                   contain digits / symbols even if the user pastes them. */
                onChange={(e) => { set('name', sanitizeName(e.target.value)); setErrors((prev) => ({ ...prev, name: '' })); }}
                onBlur={() => {
                  // Trim trailing space when focus leaves so the stored
                  // value is canonical without disrupting in-progress typing.
                  if (data.name !== data.name.trim()) set('name', data.name.trim());
                }}
                error={errors.name}
              />
              <div>
                <Input
                  label="Email"
                  required
                  type="email"
                  value={data.email}
                  placeholder="you@email.com"
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  maxLength={255}
                  /* sanitizeEmail strips whitespace anywhere (paste from
                     email clients often appends trailing spaces). The strict
                     regex (TLD ≥ 2 chars) runs at validation time. */
                  onChange={(e) => { set('email', sanitizeEmail(e.target.value)); setErrors((prev) => ({ ...prev, email: '' })); }}
                  error={errors.email}
                />

                {/* Live duplicate-email feedback (hidden once a format error shows). */}
                {!errors.email && emailCheck.status === 'checking' && (
                  <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1.5">
                    <Loader size="xs" tone="current" />
                    Checking if this email is already registered…
                  </p>
                )}
                {!errors.email && emailCheck.status === 'exists' && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700">
                    <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      This email is already registered — {emailCheck.count} existing enrollment
                      {emailCheck.count === 1 ? '' : 's'}.
                      {emailCheck.currentPlan?.planLabel && (
                        <> Current plan: <span className="font-medium">{emailCheck.currentPlan.planLabel}</span>.</>
                      )}
                    </span>
                  </div>
                )}
                {!errors.email && emailCheck.status === 'new' && (
                  <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    No existing enrollment for this email.
                  </p>
                )}
              </div>
            </div>

            <Input
              label="Phone"
              required
              type="tel"
              value={data.phone}
              placeholder="9876543210"
              autoComplete="tel"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              /* sanitizePhone strips non-digits, paste-strips leading "+91"
                 / "091" country codes, truncates to 10. The 6/7/8/9 leading-
                 digit rule is enforced at validation time so the keystroke
                 isn't silently rejected if the user types e.g. "5" by
                 accident (the inline error explains the rule instead). */
              onChange={(e) => { set('phone', sanitizePhone(e.target.value)); setErrors((prev) => ({ ...prev, phone: '' })); }}
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
              label="Admin Notes (Optional)"
              value={data.notes}
              placeholder="Notes visible only to admins"
              rows={3}
              maxLength={500}
              showCount
              onChange={(e) => { set('notes', e.target.value); setErrors((prev) => ({ ...prev, notes: '' })); }}
              error={errors.notes}
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
                <SectionLabel n="1" title="Course" hint={selectedCourseId ? undefined : 'Required'} status={courseStatus} />
                {coursesLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading courses...</div>
                ) : courseList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No active courses found. Create one in Courses Master first.</div>
                ) : (
                  <>
                    {/* Search input — filters grouped cards by course name. */}
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        placeholder="Search course by name..."
                        className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-colors"
                      />
                      {courseSearch && (
                        <button
                          type="button"
                          onClick={() => setCourseSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          aria-label="Clear search"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {groupedCourses.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        No courses match "{courseSearch}". Try a different name.
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {groupedCourses.map(({ name, variants }) => (
                          <CourseGroupCard
                            key={name}
                            courseName={name}
                            variants={variants}
                            selectedCourseId={selectedCourseId}
                            onSelect={(id) => {
                              setSelectedCourseId(String(id));
                              setErrors((prev) => ({ ...prev, _course: '' }));
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </>
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
                  hint={!selectedCourseId ? 'Pick a course first' : (selectedPlanId ? undefined : 'Required')}
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
                          setErrors((prev) => ({ ...prev, _plan: '' }));
                        }}
                      />
                    ))}
                  </div>
                )}
                {errors._plan && <p className="text-red-500 text-xs">{errors._plan}</p>}
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
              />

              {selectedCourse && selectedPlan && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                  <div className="text-slate-400 mb-1 uppercase tracking-wider text-[10px] font-semibold">Selection</div>
                  <p className="text-slate-700">
                    <span className="font-medium">{selectedCourse.nameOfCourseAsGroup}</span>
                    <br />
                    <span className="text-slate-500">{selectedPlan.name}</span>
                    <br />
                    <span className="text-slate-400">{internalDurationLabel(selectedPlan)}</span>
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
                  ['Duration',      internalDurationLabel(selectedPlan)],
                  ['Base Price',    inr(feeBreakdown.basePrice)],
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
