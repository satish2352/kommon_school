import { useState } from 'react'
import { useBranding } from '../context/BrandingContext'
import ContactTabs from '../components/common/ContactTabs'
import { contactService } from '../services/contactService'

const stats = [
  { value: '10K+',  label: 'Students Trained',  bg: 'bg-blue-50',    color: 'text-blue-600'   },
  { value: '94%',   label: 'Placement Rate',     bg: 'bg-purple-50',  color: 'text-purple-600' },
  { value: '< 24h', label: 'Response Time',      bg: 'bg-emerald-50', color: 'text-emerald-600'},
  { value: '40%',   label: 'Score Improvement',  bg: 'bg-orange-50',  color: 'text-orange-600' },
]

const nextSteps = [
  { num: '01', title: 'Submit Your Request', desc: 'Fill the form and tell us your goals — takes under 2 minutes.' },
  { num: '02', title: 'We Review & Respond',  desc: 'Our team reaches out within one business day with a tailored plan.' },
  { num: '03', title: 'Get Started',          desc: 'Get instant access and start your first AI mock interview session.' },
]

const MESSAGE_MAX = 1000
const MESSAGE_MIN = 10
// 10-digit Indian mobile starting 6-9 — same rule used across the platform.
const PHONE_REGEX = /^[6-9]\d{9}$/

export default function Contact() {
  const { brandName } = useBranding()
  const [form, setForm]         = useState({ name: '', email: '', phone: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors]     = useState({})

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email is required'

    const phone = form.phone.trim()
    if (!phone) errs.phone = 'Phone is required'
    else if (!PHONE_REGEX.test(phone)) errs.phone = 'Enter a valid 10-digit mobile number starting with 6-9'

    const msg = form.message.trim()
    if (!msg) errs.message = 'Message is required'
    else if (msg.length < MESSAGE_MIN) errs.message = `Message must be at least ${MESSAGE_MIN} characters`
    else if (msg.length > MESSAGE_MAX) errs.message = `Message must be at most ${MESSAGE_MAX} characters`

    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    // Phone: keep digits only, capped at 10. Message: hard-cap at the limit.
    let v = value
    if (name === 'phone') v = value.replace(/\D/g, '').slice(0, 10)
    else if (name === 'message') v = value.slice(0, MESSAGE_MAX)
    setForm({ ...form, [name]: v })
    setErrors({ ...errors, [name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitting(true)
    try {
      await contactService.submit({
        name:    form.name.trim(),
        email:   form.email.trim(),
        phone:   form.phone.trim(),
        message: form.message.trim(),
      })
      setSubmitted(true)
    } catch (err) {
      setErrors({ submit: err?.message || 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const inp  = 'w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors'
  const inpOk  = `${inp} border-gray-200 bg-gray-50 focus:bg-white`
  const inpErr = `${inp} border-red-300 bg-red-50`

  return (
    <>
      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative hero-bg-animated overflow-hidden pt-24 md:pt-32 pb-14 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div data-aos="fade-up" className="chip-shine inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-semibold mb-5">
            Get in Touch
          </div>
          <h1 data-aos="fade-up" data-aos-delay="80" className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight">
            Let&apos;s Start Your <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
              Interview Journey
            </span>
          </h1>
          <p data-aos="fade-up" data-aos-delay="160" className="text-gray-300 text-lg max-w-xl mx-auto">
            Have a question or ready to get started? We&apos;re here and we respond fast.
          </p>
        </div>
      </section>

      {/* ── Main ──────────────────────────────────────── */}
      <section className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-stretch">

            {/* ── Left — Form (3 cols) ─────────────────── */}
            <div
              className="lg:col-span-3 bg-white rounded-3xl p-7 sm:p-10 shadow-sm border border-gray-100 flex flex-col"
              data-aos="fade-up"
            >
              {/* Form header */}
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Send Us a Message</h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Tell us your goal and we&apos;ll point you to the right plan — we respond within one business day.
                </p>
              </div>

              {submitted ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message Received!</h3>
                  <p className="text-gray-500 text-sm mb-6 max-w-xs">
                    Thanks, <span className="font-semibold text-gray-700">{form.name}</span>! We&apos;ll reach out to{' '}
                    <span className="font-semibold text-gray-700">{form.email}</span> within one business day.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', message: '' }) }}
                    className="text-indigo-600 text-sm font-semibold hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 gap-4">

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" name="name" value={form.name} onChange={handleChange}
                      placeholder="e.g. Priya Sharma"
                      className={errors.name ? inpErr : inpOk}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  {/* Email + Phone */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email" name="email" value={form.email} onChange={handleChange}
                        placeholder="you@email.com"
                        className={errors.email ? inpErr : inpOk}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel" name="phone" value={form.phone} onChange={handleChange}
                        inputMode="numeric" maxLength={10}
                        placeholder="9876543210"
                        className={errors.phone ? inpErr : inpOk}
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Message — flex-1 to fill remaining height */}
                  <div className="flex flex-col flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message" value={form.message} onChange={handleChange}
                      maxLength={MESSAGE_MAX}
                      placeholder="Tell us your goal — preparing for interviews, improving communication, landing a specific role..."
                      className={`resize-none flex-1 min-h-[140px] ${errors.message ? inpErr : inpOk}`}
                    />
                    {/* Validation message (left) + live character count (right). */}
                    <div className="flex items-start justify-between gap-2 mt-1">
                      <span className="text-red-500 text-xs">{errors.message || ''}</span>
                      <span className={`text-xs shrink-0 tabular-nums ${form.message.length >= MESSAGE_MAX ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {form.message.length}/{MESSAGE_MAX}
                      </span>
                    </div>
                  </div>

                  {errors.submit && (
                    <p className="text-red-500 text-sm text-center">{errors.submit}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gradient-cta w-full py-4 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 mt-auto disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {submitting ? 'Sending…' : 'Send Message →'}
                  </button>
                </form>
              )}

              {/* Divider + contact cards */}
              <div className="mt-8 pt-7 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Or reach us directly</p>
                <ContactTabs />
              </div>
            </div>

            {/* ── Right — Info panel (2 cols) ──────────── */}
            <div className="lg:col-span-2 flex flex-col gap-5" data-aos="fade-up" data-aos-delay="100">

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-2xl p-5 text-center hover:scale-[1.03] hover:shadow-md transition-all duration-300 cursor-default`}>
                    <div className={`text-2xl font-extrabold ${s.color} mb-1`}>{s.value}</div>
                    <div className="text-gray-600 text-xs font-medium">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* What happens next */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-900 mb-5 uppercase tracking-widest">What Happens Next</h3>
                <div className="space-y-5">
                  {nextSteps.map((s) => (
                    <div key={s.num} className="flex items-start gap-4">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-extrabold text-xs"
                        style={{ background: 'rgba(97,97,213,0.1)', color: '#6161d5' }}
                      >
                        {s.num}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{s.title}</div>
                        <div className="text-xs text-gray-500 leading-relaxed mt-0.5">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why Kommon AI */}
              <div
                className="flex-1 rounded-2xl p-6 text-white flex flex-col justify-between"
                style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0d1b3e 100%)' }}
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{brandName} AI</div>
                      <div className="text-white/50 text-[10px]">by Sumago Infotech Pvt Ltd</div>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed mb-5">
                    AI-powered interview preparation platform helping students and professionals walk into every interview with confidence.
                  </p>
                  <div className="space-y-2.5">
                    {[
                      'Real-time AI feedback after every session',
                      'Personalized improvement roadmap',
                      'HR, Technical & Managerial scenarios',
                      'Voice & communication analysis',
                    ].map((point) => (
                      <div key={point} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-indigo-500/30 flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-white/75 text-xs">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 pt-5 border-t border-white/10 text-white/40 text-[10px]">
                  Powered by <span className="text-white/60 font-medium">{brandName}</span> · Brought to you by{' '}
                  <span className="text-white/60 font-medium">Sumago Infotech Pvt Ltd</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
