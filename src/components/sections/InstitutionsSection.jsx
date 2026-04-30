import { useState, useEffect, useRef } from 'react'
import { useInstitutionModal } from '../../context/InstitutionModalContext'
import ContactTabs from '../common/ContactTabs'

const CYCLE_MS = 1750

const problems = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    problem: 'Students lack communication skills despite strong academics',
    impact: 'Over 60% of placement rejections cite weak communication — not lack of knowledge.',
    solution: 'AI-driven communication training bridges the gap between knowledge and confident expression',
    solutionStat: 'Students improve communication scores by 40% within 6 sessions',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    problem: 'Faculty bandwidth cannot support 1:1 coaching at scale',
    impact: 'A single faculty member cannot meaningfully coach more than 15–20 students at once.',
    solution: 'AI handles unlimited simultaneous sessions without any additional faculty overhead',
    solutionStat: 'Faculty save 12+ hours/week while students get 3× more practice',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    problem: 'No real-time visibility into student placement readiness',
    impact: 'Most institutions discover placement gaps only days before the drive — too late to act.',
    solution: 'Live dashboards show exactly which students need attention — before it is too late',
    solutionStat: "Track every student's readiness score, session history, and growth in real time",
  },
]

const steps = [
  {
    num: '01',
    title: 'Quick Onboarding, Zero Hassle',
    desc: 'Onboard cohorts in minutes via secure links, email invites, or LMS integration — no technical complexity required.',
  },
  {
    num: '02',
    title: 'Personalized Skill Journeys Begin',
    desc: 'Students choose modules like AI Interviews or follow AI-recommended roadmaps tailored to their goals.',
  },
  {
    num: '03',
    title: 'Monitor Progress with Smart Dashboards',
    desc: 'Directors, Faculty and TPOs get smart insights, skill data, and analytics to drive better outcomes.',
  },
]

const features = [
  { title: 'Placement-Focused AI Training',   desc: 'Structured AI interview simulations designed to improve placement readiness across every student cohort.', icon: '🎯' },
  { title: 'Faculty Development Programs',    desc: 'Equip faculty with AI-powered tools to lead communication programs and support student growth at scale.', icon: '👨‍🏫' },
  { title: 'Scalable to Any Batch Size',      desc: 'Deploy from 50 to 5,000 students without additional resources, infrastructure, or coordination overhead.', icon: '⚡' },
  { title: 'Real-Time Dashboards',            desc: 'Monitor student progress, batch analytics, and placement readiness metrics in a single unified view.', icon: '📊' },
  { title: 'Curriculum-Aligned Scenarios',   desc: 'AI roleplay scenarios aligned with your specific programs, industries, and learning outcomes.', icon: '📚' },
  { title: 'NEP, NAAC & OBE Reporting',      desc: 'Automated compliance-ready reports aligned with NEP 2020, NAAC, and OBE frameworks — zero manual work.', icon: '📋' },
]

const stats = [
  { value: '40%', label: 'Avg. improvement in student communication scores' },
  { value: '3x',  label: 'More practice sessions vs traditional coaching' },
  { value: '94%', label: 'Placement readiness rate after 8 weeks' },
]

const caseStudies = [
  { institution: 'Engineering College, Pune',       result: '94% placement rate',   detail: '128 final-year students completed 8 weeks of AI interview practice. Placement rate rose from 67% to 94%.', tag: 'Placement Cell', color: 'blue'   },
  { institution: 'Management Institute, Bengaluru', result: '40% score improvement', detail: 'MBA students showed a 40% average improvement in communication scores across 3 cohorts in one semester.', tag: 'MBA Program',    color: 'indigo' },
  { institution: 'Polytechnic, Nagpur',             result: '3x practice volume',   detail: 'Faculty time savings of 12 hours/week while students completed 3x more interview practice sessions.',       tag: 'Faculty Program', color: 'purple' },
]

const supportPoints = [
  {
    text: 'Support for onboarding and rollout planning',
    icon: <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    text: 'Local engagement and relationship management',
    icon: <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  },
  {
    text: 'Continuous coordination for institutional success',
    icon: <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  },
]

export default function InstitutionsSection() {
  const { open: openInstitutionModal } = useInstitutionModal()
  const [activeStep, setActiveStep] = useState(0)
  const [resetting, setResetting] = useState(false)
  const hasLooped = useRef(false)

  useEffect(() => {
    const id = setInterval(() => setActiveStep(prev => (prev + 1) % steps.length), CYCLE_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (activeStep === 0) {
      if (!hasLooped.current) { hasLooped.current = true; return }
      setResetting(true)
      const t = setTimeout(() => setResetting(false), 150)
      return () => clearTimeout(t)
    }
  }, [activeStep])

  return (
    <div>

      {/* ── Hero Banner ────────────────────────────────── */}
      <div
        className="relative bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-indigo-950 rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 mb-10 md:mb-16 overflow-hidden"
        data-aos="fade-up"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center max-w-4xl mx-auto">
          <div className="chip-shine inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs sm:text-sm font-semibold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Meet Kommon AI
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
            AI Led Communication Enablement for
            <br className="hidden sm:block" />{' '}
            <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
              Higher Education Institutions
            </span>
          </h2>

          <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-7 max-w-2xl mx-auto">
            From placement prep to faculty training — AI-driven communication coaching designed to scale across batches and deliver measurable outcomes, with regional support from Sumago Infotech in Maharashtra.
          </p>

          <button
            onClick={openInstitutionModal}
            className="btn-gradient-cta inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-white font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-0.5 transition-all duration-300"
          >
            Talk to Our Team
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>

          <p className="text-gray-500 text-xs mt-5">
            Built for institutions. Enabled through a trusted regional partner ecosystem.
          </p>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-10 md:mb-16">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="text-center bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300"
            data-aos="fade-up" data-aos-delay={String(i * 100 + 100)}
          >
            <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">{s.value}</div>
            <div className="text-gray-500 text-[10px] sm:text-xs leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Live Dashboard Preview ─────────────────────── */}
      <div className="mb-10 md:mb-16" data-aos="fade-up">
        <div className="text-center mb-6 sm:mb-8">
          <span className="chip-badge chip-shine mb-3">Live Batch Analytics</span>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Real-Time Visibility Into Every Student</h3>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">Track placement readiness, session progress, and performance gaps — all in one dashboard.</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-gray-800">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white font-semibold text-xs sm:text-sm">Batch Analytics — B.E. CSE 2025</div>
              <div className="text-gray-400 text-[10px] mt-0.5">128 students · Week 6 of 8</div>
            </div>
            <div className="flex gap-2">
              <div className="px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-[10px] sm:text-xs">Live</div>
              <div className="hidden sm:block px-2.5 py-1 rounded-full bg-gray-700 text-gray-300 text-xs">Export CSV</div>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
            {[
              { label: 'Avg Score',       value: '78', change: '+12', color: 'text-blue-400'   },
              { label: 'Sessions Done',   value: '640', change: '+80', color: 'text-emerald-400'},
              { label: 'Interview Ready', value: '89',  unit: '%',     color: 'text-purple-400' },
              { label: 'Need Coaching',   value: '14',                 color: 'text-orange-400' },
            ].map((m) => (
              <div key={m.label} className="bg-gray-800 rounded-xl p-3">
                <div className={`text-xl sm:text-2xl font-extrabold ${m.color}`}>{m.value}{m.unit || ''}</div>
                <div className="text-gray-400 text-[10px] mt-0.5">{m.label}</div>
                {m.change && <div className="text-green-400 text-[10px] mt-1">↑ {m.change} this week</div>}
              </div>
            ))}
          </div>

          {/* Student table — scrollable on mobile */}
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[360px]">
                <div className="grid grid-cols-4 px-4 py-2.5 bg-gray-700/50 text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                  <span>Student</span><span>Score</span><span>Sessions</span><span>Status</span>
                </div>
                {[
                  { name: 'Ayesha K.', score: 88, sessions: 7, status: 'Ready',     statusColor: 'bg-green-500/20 text-green-300'  },
                  { name: 'Rahul S.',  score: 74, sessions: 5, status: 'On Track',  statusColor: 'bg-blue-500/20 text-blue-300'    },
                  { name: 'Divya M.', score: 61, sessions: 3, status: 'Needs Help', statusColor: 'bg-orange-500/20 text-orange-300'},
                  { name: 'Arjun T.', score: 91, sessions: 8, status: 'Ready',     statusColor: 'bg-green-500/20 text-green-300'  },
                  { name: 'Sneha P.', score: 68, sessions: 4, status: 'On Track',  statusColor: 'bg-blue-500/20 text-blue-300'    },
                ].map((r) => (
                  <div key={r.name} className="grid grid-cols-4 px-4 py-3 border-t border-gray-700">
                    <span className="text-gray-300 text-xs">{r.name}</span>
                    <span className="text-white text-xs font-semibold">{r.score}</span>
                    <span className="text-gray-400 text-xs">{r.sessions}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium w-fit ${r.statusColor}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Problem → Solution ────────────────────────── */}
      <div className="mb-10 md:mb-16">
        <div className="text-center mb-8 sm:mb-10" data-aos="fade-up">
          <span className="chip-badge chip-shine mb-3">The Challenge</span>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Why Traditional Placement Training Falls Short</h3>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">Institutions face structural barriers that AI is uniquely positioned to solve.</p>
        </div>

        <div className="space-y-4">
          {problems.map((p, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              data-aos="fade-up" data-aos-delay={String(i * 100 + 100)}
            >
              {/* Mobile: stacked with a visual connector */}
              <div className="grid md:grid-cols-11">
                {/* Challenge */}
                <div className="md:col-span-5 p-5 sm:p-6 bg-red-50 border border-red-100 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-500 flex-shrink-0">
                        {p.icon}
                      </div>
                      <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest">
                        Challenge {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h4 className="text-gray-900 font-bold text-sm sm:text-base leading-snug mb-2">{p.problem}</h4>
                    <p className="text-gray-500 text-xs leading-relaxed">{p.impact}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-red-100">
                    <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-400 text-[10px] font-medium">Unresolved without the right system</span>
                  </div>
                </div>

                {/* Desktop arrow connector */}
                <div className="hidden md:flex md:col-span-1 items-center justify-center bg-gray-50 border-y border-gray-100">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-white border-2 shadow flex items-center justify-center" style={{ borderColor: '#6161d5' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: '#6161d5' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-300">AI Fix</span>
                  </div>
                </div>

                {/* Mobile arrow connector */}
                <div className="md:hidden flex items-center justify-center py-2 bg-gray-100 border-x border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white border-2 shadow-sm flex items-center justify-center" style={{ borderColor: '#6161d5' }}>
                      <svg className="w-3.5 h-3.5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: '#6161d5' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#6161d5' }}>Kommon AI Fix</span>
                  </div>
                </div>

                {/* Solution */}
                <div className="md:col-span-5 p-5 sm:p-6 bg-white border border-gray-100 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-green-600 text-[10px] font-bold uppercase tracking-widest">Kommon School Solution</span>
                    </div>
                    <p className="text-gray-800 font-semibold text-sm leading-relaxed mb-3">{p.solution}</p>
                  </div>
                  <div
                    className="flex items-start gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(97,97,213,0.07)', border: '1px solid rgba(97,97,213,0.12)' }}
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#6161d5' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-xs font-medium" style={{ color: '#6161d5' }}>{p.solutionStat}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works ──────────────────────────────── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 mb-10 md:mb-16 border border-gray-100 shadow-sm">
        <div className="text-center mb-8 sm:mb-10" data-aos="fade-up">
          <span className="chip-badge chip-shine mb-3">How It Works</span>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">How It Works for Colleges &amp; Universities</h3>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">A structured deployment that delivers measurable outcomes without disrupting your existing programs.</p>
        </div>

        {/* Mobile: vertical stepper | Desktop: horizontal */}
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-0 sm:gap-6">
          {steps.map((s, i) => {
            const isActive = activeStep === i
            const lineFilled = activeStep > i
            return (
              <div key={i} className="relative">
                {/* Desktop connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 z-0" style={{ left: 'calc(50% + 1.75rem)', width: 'calc(100% - 2rem)' }}>
                    <div className="relative w-full h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(97,97,213,0.2)' }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: lineFilled ? '100%' : '0%',
                          background: 'linear-gradient(90deg, #6161d5, #00127f)',
                          transition: resetting ? 'width 100ms ease-in' : 'width 600ms ease-out',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Mobile connector line (vertical) */}
                {i < steps.length - 1 && (
                  <div className="sm:hidden absolute left-7 top-14 w-0.5 h-8 rounded-full" style={{ background: 'rgba(97,97,213,0.3)' }} />
                )}

                {/* Step content */}
                <div
                  className={`relative z-10 flex sm:flex-col gap-4 sm:gap-0 pb-10 sm:pb-0 ${
                    isActive ? 'sm:-translate-y-2 sm:scale-[1.03] opacity-100' : 'sm:translate-y-0 sm:scale-100 opacity-80'
                  }`}
                  style={{ transition: 'transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 700ms ease' }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center font-extrabold text-lg flex-shrink-0 sm:mb-4 sm:mx-auto">
                    <span style={{
                      background: 'linear-gradient(135deg, #6161d5, #00127f)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      {s.num}
                    </span>
                  </div>
                  <div className="sm:text-center">
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1.5">{s.title}</h4>
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Platform Features ─────────────────────────── */}
      <div className="mb-10 md:mb-16">
        <div className="text-center mb-8 sm:mb-10" data-aos="fade-up">
          <span className="chip-badge chip-shine mb-3">Platform Capabilities</span>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Built for the Way Institutions Actually Work</h3>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">Every feature is designed around institutional workflows — not repurposed consumer tools.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex gap-4 sm:block"
              data-aos="fade-up" data-aos-delay={String((i % 3) * 80 + 100)}
            >
              <div className="text-2xl sm:mb-3 flex-shrink-0">{f.icon}</div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1 sm:mb-2 group-hover:text-indigo-600 transition-colors duration-300">{f.title}</h4>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Case Studies ──────────────────────────────── */}
      <div className="mb-10 md:mb-16">
        <div className="text-center mb-8 sm:mb-10" data-aos="fade-up">
          <span className="chip-badge chip-shine mb-3">Real Results</span>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Institutions Seeing Measurable Outcomes</h3>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">Early adopters are already reporting transformative placement results.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {caseStudies.map((c, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              data-aos="fade-up" data-aos-delay={String(i * 100 + 100)}
            >
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                c.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                c.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'
              }`}>{c.tag}</div>
              <div className={`text-2xl font-extrabold mb-1.5 bg-gradient-to-r ${
                c.color === 'blue' ? 'from-blue-600 to-indigo-600' :
                c.color === 'indigo' ? 'from-indigo-600 to-purple-600' : 'from-purple-600 to-pink-600'
              } bg-clip-text text-transparent`}>{c.result}</div>
              <div className="text-gray-700 text-sm font-semibold mb-2">{c.institution}</div>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{c.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Regional Support ──────────────────────────── */}
      <div
        className="relative bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-indigo-950 rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 mb-10 md:mb-16 overflow-hidden"
        data-aos="fade-up"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left */}
          <div>
            <div className="chip-shine inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold mb-5">
              Regional Support
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
              Institutional Deployment Support in Maharashtra
            </h3>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
              For institutions in Maharashtra, engagement, onboarding, and ongoing support are facilitated through Sumago Infotech — enabling localized alignment and a seamless institutional experience.
            </p>
            <ul className="space-y-3">
              {supportPoints.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-white text-xs sm:text-sm font-medium">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — Partner Card */}
          <div className="mt-6 lg:mt-0">
            <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <p className="text-gray-400 text-sm text-center tracking-wide mb-4">Exclusive Partner</p>
              <div className="border-t border-white/10 mb-5" />
              <div className="bg-white rounded-xl p-6 flex items-center justify-center min-h-[90px] sm:min-h-[100px]">
                <div className="text-center">
                  <div className="text-red-600 font-extrabold text-lg sm:text-xl leading-tight">Sumago Infotech Pvt. Ltd.</div>
                  <div className="text-gray-500 text-xs mt-1 italic">Strive With Technology...!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reach Us Directly ─────────────────────────── */}
      <div className="mb-10 md:mb-16" data-aos="fade-up">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-wider">Reach Us Directly</h3>
          <ContactTabs />
        </div>
      </div>

      {/* ── Final CTA ─────────────────────────────────── */}
      <div
        className="bg-[#1A1A2E] rounded-2xl p-6 sm:p-10 text-center"
        data-aos="zoom-in"
      >
        <h4 className="text-white font-bold text-xl sm:text-2xl mb-2 sm:mb-3">Ready to Transform Your Placement Cell?</h4>
        <p className="text-gray-300 text-xs sm:text-sm mb-6 max-w-lg mx-auto leading-relaxed">
          Book a platform walkthrough with our institutional team and see measurable results in weeks.
        </p>
        <button
          onClick={openInstitutionModal}
          className="btn-gradient-cta w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full text-white font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          Talk to Our Team
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  )
}
