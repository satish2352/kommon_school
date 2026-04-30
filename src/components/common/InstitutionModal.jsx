import { useState, useEffect } from 'react'
import { useInstitutionModal } from '../../context/InstitutionModalContext'

const STEPS = ['About You', 'Institution', 'Wrap Up']

const institutionTypes = [
  'Engineering College', 'MBA Institute', 'University', 'Polytechnic',
  'Nursing College', 'Law School', 'Training Centre', 'Placement Cell',
]

const studentStrengths = ['< 100', '100 – 500', '500 – 1000', '1000 – 3000', '3000+']

const sources = ['LinkedIn', 'Google Search', 'Sumago Infotech', 'Conference / Event', 'Colleague / Faculty', 'Other']

const init = {
  contactName: '', institutionName: '', email: '', phone: '',
  institutionType: '', strength: '', location: '',
  source: '', notes: '',
}

function Pill({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
        selected
          ? 'bg-[#6161d5] text-white border-[#6161d5] shadow-sm'
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#6161d5] hover:text-[#6161d5]'
      }`}
    >
      {label}
    </button>
  )
}

export default function InstitutionModal() {
  const { isOpen, close } = useInstitutionModal()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(init)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (isOpen) { setStep(0); setForm(init); setErrors({}); setSubmitted(false) }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const validate = () => {
    const errs = {}
    if (step === 0) {
      if (!form.contactName.trim() || form.contactName.trim().length < 2) errs.contactName = 'Please enter your full name'
      if (!form.institutionName.trim()) errs.institutionName = 'Institution name is required'
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email'
      if (!/^\d{10}$/.test(form.phone)) errs.phone = 'Enter a valid 10-digit phone number'
    }
    if (step === 1) {
      if (!form.institutionType) errs.institutionType = 'Please select your institution type'
      if (!form.strength) errs.strength = 'Please select student strength'
    }
    return errs
  }

  const next = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setStep(s => s + 1)
  }

  const back = () => { setErrors({}); setStep(s => s - 1) }

  const handleSubmit = () => setSubmitted(true)

  const progress = (step / (STEPS.length - 1)) * 100

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-1">
                Step {step + 1} of {STEPS.length} — {STEPS[step]}
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                {step === 0 && 'Tell Us About You'}
                {step === 1 && 'Your Institution'}
                {step === 2 && 'Almost Done'}
              </h2>
            </div>
            <button onClick={close} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-4 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6161d5, #00127f)' }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {submitted ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Request Received!</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
                Thank you, <span className="font-medium text-gray-700">{form.contactName}</span>! Our institutional team will reach out to <span className="font-medium text-gray-700">{form.email}</span> within one business day.
              </p>
              <button onClick={close} className="text-indigo-600 text-sm font-semibold hover:underline">
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Step 0 — Contact Details */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.contactName}
                        onChange={e => { set('contactName', e.target.value); setErrors(p => ({ ...p, contactName: '' })) }}
                        placeholder="e.g. Dr. Priya Sharma"
                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${errors.contactName ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                      />
                      {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => { set('phone', e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors(p => ({ ...p, phone: '' })) }}
                        placeholder="10-digit mobile number"
                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => { set('email', e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                      placeholder="you@institution.edu.in"
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Institution Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.institutionName}
                      onChange={e => { set('institutionName', e.target.value); setErrors(p => ({ ...p, institutionName: '' })) }}
                      placeholder="e.g. ABC Engineering College, Pune"
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${errors.institutionName ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                    />
                    {errors.institutionName && <p className="text-red-500 text-xs mt-1">{errors.institutionName}</p>}
                  </div>
                </div>
              )}

              {/* Step 1 — Institution Details */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2.5">
                      Institution Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {institutionTypes.map(t => (
                        <Pill
                          key={t} label={t} selected={form.institutionType === t}
                          onClick={() => { set('institutionType', t); setErrors(p => ({ ...p, institutionType: '' })) }}
                        />
                      ))}
                    </div>
                    {errors.institutionType && <p className="text-red-500 text-xs mt-2">{errors.institutionType}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2.5">
                      Total Student Strength <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {studentStrengths.map(s => (
                        <Pill
                          key={s} label={s} selected={form.strength === s}
                          onClick={() => { set('strength', s); setErrors(p => ({ ...p, strength: '' })) }}
                        />
                      ))}
                    </div>
                    {errors.strength && <p className="text-red-500 text-xs mt-2">{errors.strength}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">City / Location</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={e => set('location', e.target.value)}
                      placeholder="e.g. Nashik, Maharashtra"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Step 2 — Wrap Up */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2.5">How did you hear about us?</label>
                    <div className="flex flex-wrap gap-2">
                      {sources.map(s => (
                        <Pill key={s} label={s} selected={form.source === s} onClick={() => set('source', s)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Any additional notes?</label>
                    <textarea
                      value={form.notes}
                      onChange={e => set('notes', e.target.value)}
                      rows={4}
                      placeholder="Anything specific you'd like us to know — your programs, current tools, or expectations..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors resize-none"
                    />
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                    <div className="text-xs font-bold text-indigo-700 mb-2 uppercase tracking-wider">Summary</div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p><span className="font-medium text-gray-800">Contact:</span> {form.contactName} · {form.email}</p>
                      <p><span className="font-medium text-gray-800">Institution:</span> {form.institutionName} ({form.institutionType || '—'})</p>
                      <p><span className="font-medium text-gray-800">Strength:</span> {form.strength || '—'} · <span className="font-medium text-gray-800">Location:</span> {form.location || '—'}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={step === 0 ? close : back}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all duration-150"
            >
              {step === 0 ? 'Cancel' : '← Back'}
            </button>
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${i === step ? 'w-5 h-1.5 bg-[#6161d5]' : i < step ? 'w-1.5 h-1.5 bg-[#6161d5]/40' : 'w-1.5 h-1.5 bg-gray-200'}`}
                />
              ))}
            </div>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="btn-gradient-cta px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-gradient-cta px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Submit Request
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
