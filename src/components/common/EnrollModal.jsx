import { useState, useEffect } from 'react'
import { useEnrollModal } from '../../context/EnrollModalContext'
import { createEnrollment } from '../../services/enrollmentApi'
import PaymentModal from './PaymentModal'

// Map user-friendly labels in the form to the backend enum values.
const ROLE_MAP = {
  'Student': 'STUDENT',
  'Fresh Graduate': 'FRESH_GRADUATE',
  'Working Professional': 'WORKING_PROFESSIONAL',
  'Career Switcher': 'CAREER_SWITCHER',
}
const EDUCATION_MAP = {
  'School': 'SCHOOL',
  'Jr College': 'JR_COLLEGE',
  'Undergraduate': 'UNDERGRADUATE',
  'Graduate': 'GRADUATE',
  'Post Graduate': 'POST_GRADUATE',
  'Doctorate': 'DOCTORATE',
  'Other': 'OTHER',
}
const READINESS_MAP = {
  'Beginner': 'BEGINNER',
  'Intermediate': 'INTERMEDIATE',
  'Ready for Interview': 'READY_FOR_INTERVIEW',
}
const SOURCE_MAP = {
  'Social Media': 'SOCIAL_MEDIA',
  'College / University': 'COLLEGE',
  'Friend / Colleague': 'FRIEND',
  'Google Search': 'GOOGLE',
  'Other': 'OTHER',
}

const STEPS = [
  { title: 'About You', subtitle: 'Help us understand who you are' },
  { title: 'Practice Preferences', subtitle: 'Last step — almost there!' },
]

const Pill = ({ icon, label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
      selected
        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
        : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
    }`}
  >
    {icon && <span className="text-base leading-none">{icon}</span>}
    {label}
  </button>
)

const Card = ({ icon, label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center text-xs font-semibold transition-all duration-150 ${
      selected
        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
        : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
    }`}
  >
    <span className="text-lg">{icon}</span>
    {label}
  </button>
)

export default function EnrollModal() {
  const { isOpen, close } = useEnrollModal()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    role: '', education: '', readiness: '', name: '', email: '', phone: '',
    source: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdEnrollment, setCreatedEnrollment] = useState(null)
  const [paymentOpen, setPaymentOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setStep(0)
      setSubmitted(false)
      setErrors({})
      setSubmitting(false)
      setCreatedEnrollment(null)
      setPaymentOpen(false)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }))

  const validate = () => {
    const e = {}
    if (step === 0) {
      if (!data.name.trim()) e.name = 'Full name is required'
      else if (data.name.trim().length < 2) e.name = 'Enter a valid name'
      if (!data.phone.trim()) e.phone = 'Mobile number is required'
      else if (!/^\d{10}$/.test(data.phone)) e.phone = 'Enter a valid 10-digit mobile number'
      if (!data.email.trim()) e.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email address'
      if (!data.role) e.role = 'Please select who you are'
    }
    return e
  }

  const next = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
      return
    }

    // Final step — submit to backend, then open the payment modal.
    setSubmitting(true)
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        role: ROLE_MAP[data.role],
        ...(data.education ? { education: EDUCATION_MAP[data.education] } : {}),
        ...(data.readiness ? { readiness: READINESS_MAP[data.readiness] } : {}),
        ...(data.source ? { source: SOURCE_MAP[data.source] } : {}),
      }
      const resp = await createEnrollment(payload)
      const enrolled = resp?.data ?? resp
      setCreatedEnrollment({
        id: enrolled.id,
        enrollmentId: enrolled.enrollmentId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
      })
      setSubmitted(true)
      setPaymentOpen(true)
    } catch (err) {
      const detail = Array.isArray(err.details) && err.details.length
        ? err.details.map(d => `${d.field}: ${d.message}`).join('; ')
        : null
      setErrors({ _api: detail || err.message || 'Could not submit. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const back = () => { setErrors({}); setStep(s => s - 1) }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-gray-100 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-0.5">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-lg font-bold text-gray-900">{STEPS[step].title}</h2>
              <p className="text-gray-400 text-xs mt-0.5">{STEPS[step].subtitle}</p>
            </div>
            <button onClick={close} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-indigo-600' : 'bg-gray-100'}`} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">You're all set, {data.name.split(' ')[0]}!</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                We'll reach out to <span className="font-medium text-gray-700">{data.email}</span> shortly with your personalised plan.
              </p>
              <button onClick={close} className="btn-gradient-cta px-8 py-3 rounded-full text-white font-bold text-sm">
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-6">

              {/* ── STEP 1: Contact + Identity ── */}
              {step === 0 && (
                <>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1.5">Your full name <span className="text-red-400">*</span></p>
                    <input
                      type="text" value={data.name} onChange={e => { set('name', e.target.value); setErrors(prev => ({ ...prev, name: '' })) }}
                      placeholder="e.g. Priya Sharma"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1.5">Mobile number <span className="text-red-400">*</span></p>
                      <input
                        type="tel" value={data.phone} onChange={e => { set('phone', e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors(prev => ({ ...prev, phone: '' })) }}
                        placeholder="98765 43210"
                        maxLength={10}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1.5">Email <span className="text-red-400">*</span></p>
                      <input
                        type="email" value={data.email} onChange={e => { set('email', e.target.value); setErrors(prev => ({ ...prev, email: '' })) }}
                        placeholder="you@email.com"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2.5">I am a… <span className="text-red-400">*</span></p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: '📚', label: 'Student' },
                        { icon: '🎓', label: 'Fresh Graduate' },
                        { icon: '💼', label: 'Working Professional' },
                        { icon: '🔄', label: 'Career Switcher' },
                      ].map(r => (
                        <Pill key={r.label} icon={r.icon} label={r.label} selected={data.role === r.label} onClick={() => { set('role', r.label); setErrors(prev => ({ ...prev, role: '' })) }} />
                      ))}
                    </div>
                    {errors.role && <p className="text-red-500 text-xs mt-1.5">{errors.role}</p>}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2.5">Education level</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: '🏫', label: 'School' },
                        { icon: '🏛️', label: 'Jr College' },
                        { icon: '📖', label: 'Undergraduate' },
                        { icon: '🎓', label: 'Graduate' },
                        { icon: '📜', label: 'Post Graduate' },
                        { icon: '🧪', label: 'Doctorate' },
                        { icon: '✨', label: 'Other' },
                      ].map(e => (
                        <Pill key={e.label} icon={e.icon} label={e.label} selected={data.education === e.label} onClick={() => set('education', e.label)} />
                      ))}
                    </div>
                  </div>

                </>
              )}

              {/* ── STEP 2: Preferences ── */}
              {step === 1 && (
                <>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2.5">Placement Readiness</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { icon: '🌱', label: 'Beginner' },
                        { icon: '⚙️', label: 'Intermediate' },
                        { icon: '🎯', label: 'Ready for Interview' },
                      ].map(r => (
                        <Card key={r.label} icon={r.icon} label={r.label} selected={data.readiness === r.label} onClick={() => set('readiness', r.label)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2.5">How did you hear about us?</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: '📱', label: 'Social Media' },
                        { icon: '🏫', label: 'College / University' },
                        { icon: '👥', label: 'Friend / Colleague' },
                        { icon: '🔍', label: 'Google Search' },
                        { icon: '✨', label: 'Other' },
                      ].map(s => (
                        <Pill key={s.label} icon={s.icon} label={s.label} selected={data.source === s.label} onClick={() => set('source', s.label)} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="sticky bottom-0 bg-white rounded-b-3xl px-6 py-4 border-t border-gray-100 flex flex-col gap-3">
            {errors._api && (
              <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {errors._api}
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              {step > 0 ? (
                <button onClick={back} disabled={submitting} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-40">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={next}
                disabled={submitting}
                className="btn-gradient-cta flex items-center gap-2 px-7 py-2.5 rounded-full text-white font-bold text-sm shadow hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? 'Submitting…' : (step < STEPS.length - 1 ? 'Continue' : 'Submit & Enroll')}
                {!submitting && step < STEPS.length - 1 && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment modal — opened after enrollment is created */}
      <PaymentModal
        isOpen={paymentOpen}
        enrollment={createdEnrollment}
        onClose={() => { setPaymentOpen(false); close() }}
      />
    </div>
  )
}
