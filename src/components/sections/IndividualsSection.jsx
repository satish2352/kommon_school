import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useEnrollModal } from '../../context/EnrollModalContext'

const CYCLE_MS = 1750

const problems = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    problem: 'Freezing up in interviews despite knowing your stuff',
    impact: '73% of rejections happen not because of lack of knowledge, but because nerves kill clarity and confidence in the moment.',
    solution: 'AI roleplays simulate real pressure so you stay calm and articulate under fire',
    solutionStat: '91% of users report staying noticeably calmer after just 5 practice sessions',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    problem: 'Unclear answers that fail to impress interviewers',
    impact: 'Most candidates ramble without structure — interviewers decide within the first 90 seconds if you are the right fit.',
    solution: 'Structured feedback trains you to communicate with clarity, confidence, and impact',
    solutionStat: 'Answer quality scores improve by 38% on average within 6 AI-coached sessions',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    problem: 'Practicing alone with no real feedback loop',
    impact: 'Rehearsing in a mirror or with friends gives zero calibrated data — you repeat the same mistakes without knowing it.',
    solution: '27+ parameters give you precise, actionable insights after every single session',
    solutionStat: 'Each session produces a detailed self-coaching report across 27+ communication dimensions',
  },
]

const steps = [
  {
    num: '01',
    title: 'Select Your Interview Type & Job Role',
    desc: 'Customize your session based on your target role and begin instantly.',
  },
  {
    num: '02',
    title: 'Choose Your Interviewer Style',
    desc: 'Simulate real-world scenarios by selecting interviewer personalities relevant to your industry.',
  },
  {
    num: '03',
    title: 'Get Instant Performance Feedback',
    desc: 'Analyze your responses with detailed scoring, speech evaluation, and behavioral insights.',
  },
  {
    num: '04',
    title: 'Improve with a Personalized Roadmap',
    desc: 'Follow structured recommendations to continuously enhance your communication and performance.',
  },
]

const features = [
  { title: 'Tailored Interview Simulations', desc: 'Create personalized interview experiences aligned with your role, industry, and skill level.', icon: '🎯' },
  { title: 'Advanced Performance Analytics', desc: 'Track your improvement with in-depth performance metrics and actionable feedback.', icon: '📊' },
  { title: 'Voice & Communication Analysis', desc: 'Enhance your speaking clarity, tone, and confidence using AI-powered voice insights.', icon: '🎤' },
  { title: 'Diverse Interview Formats', desc: 'Practice across HR, technical, managerial, and leadership interview scenarios.', icon: '🔄' },
  { title: 'Resume-Driven Question Generation', desc: 'Upload your resume and receive highly relevant, personalized interview questions.', icon: '📄' },
  { title: 'Holistic Candidate Evaluation', desc: 'Improve both your content and delivery with detailed feedback on communication effectiveness.', icon: '📈' },
]

const beforeAfter = [
  { before: 'Blank out when asked "Tell me about yourself"', after: 'Deliver a confident, structured 60-second pitch every time' },
  { before: 'Ramble through answers without a clear structure', after: 'Answer clearly using proven frameworks — naturally and fluently' },
  { before: 'Nervously guess what interviewers want to hear', after: 'Walk in prepared with data-backed confidence from real practice' },
  { before: 'No idea what went wrong after every rejection', after: 'Get exact scores on clarity, tone, confidence, and delivery' },
  { before: 'Practice alone with no calibrated feedback', after: 'Get AI-scored, coached, and guided after every session' },
]

export default function IndividualsSection() {
  const { open: openEnroll } = useEnrollModal()
  const [activeStep, setActiveStep] = useState(0)
  const [resetting, setResetting] = useState(false)
  const hasLooped = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep(prev => (prev + 1) % steps.length)
    }, CYCLE_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (activeStep === 0) {
      if (!hasLooped.current) {
        hasLooped.current = true
        return
      }
      setResetting(true)
      const t = setTimeout(() => setResetting(false), 150)
      return () => clearTimeout(t)
    }
  }, [activeStep])

  return (
    <div>
      {/* Hero Banner */}
      <div
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 md:p-12 mb-12 md:mb-20 border border-blue-100"
        data-aos="fade-up"
      >
        <div className="text-center mb-10">
          <div
            className="chip-badge chip-shine mb-5"
            data-aos="fade-up" data-aos-delay="50"
          >
            For Individuals
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight max-w-3xl mx-auto"
            data-aos="fade-up" data-aos-delay="100"
          >
            Transform the Way You Prepare for Interviews
          </h2>
          <p
            className="text-gray-600 max-w-2xl mx-auto leading-relaxed text-base"
            data-aos="fade-up" data-aos-delay="200"
          >
            Step into every interview fully prepared. Practice with AI-powered mock interviews, sharpen your communication, and receive real-time, data-driven feedback — all in one seamless platform designed to accelerate your career growth.
          </p>
          <div className="mt-8" data-aos="zoom-in" data-aos-delay="300">
            <button
              onClick={openEnroll}
              className="btn-gradient-cta inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Enroll Now
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* AI Roleplay Session Mockup */}
        <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl mx-auto shadow-2xl" data-aos="fade-up" data-aos-delay="200">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-white font-semibold text-sm">AI Roleplay — Product Manager Interview</div>
              <div className="text-gray-400 text-xs mt-0.5">Question 4 of 8 · Behavioral Round</div>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live Session
              </div>
              <div className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-xs font-mono">02:34</div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Questions Done', value: '4', change: 'of 8', color: 'text-blue-400' },
              { label: 'Current Score', value: '82', change: '+6 this session', color: 'text-emerald-400' },
              { label: 'Clarity', value: '87', change: 'Above avg', color: 'text-purple-400' },
              { label: 'Filler Words', value: '3', change: 'Detected so far', color: 'text-orange-400' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-800 rounded-xl p-3">
                <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-gray-400 text-[10px] mt-0.5">{s.label}</div>
                <div className="text-gray-500 text-[10px] mt-1">{s.change}</div>
              </div>
            ))}
          </div>

          {/* Question + recording row */}
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-800 rounded-xl p-4 border-l-4 border-blue-500">
              <div className="text-gray-400 text-[10px] mb-1.5">AI Interviewer is asking —</div>
              <p className="text-white text-sm font-medium leading-snug">&ldquo;Tell me about a time you handled a conflict in your team.&rdquo;</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-4">
              <div className="flex gap-0.5 items-end flex-shrink-0">
                {[12, 18, 10, 22, 14, 8, 20, 16].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-blue-400 animate-pulse"
                    style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium">Recording your answer...</div>
                <div className="text-gray-400 text-[10px]">AI listening &amp; analyzing delivery in real time</div>
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-0 divide-x divide-gray-700">
              {[['Clarity', '87', 'text-blue-400'], ['Tone', '79', 'text-indigo-400'], ['Pace', '82', 'text-emerald-400'], ['Confidence', '75', 'text-purple-400'], ['Structure', '80', 'text-teal-400'], ['Delivery', '78', 'text-orange-400']].map(([k, v, c]) => (
                <div key={k} className="p-3 text-center">
                  <div className={`text-sm font-bold ${c}`}>{v}</div>
                  <div className="text-gray-500 text-[10px] mt-0.5">{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Problem → Solution */}
      <div className="mb-12 md:mb-20">
        <div className="text-center mb-12" data-aos="fade-up">
          <span className="chip-badge chip-shine mb-3">The Problem</span>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Why Most Candidates Fail to Impress</h3>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">It&apos;s rarely a knowledge gap. It&apos;s a communication gap — and Kommon School closes it.</p>
        </div>

        <div className="space-y-4">
          {problems.map((p, i) => (
            <div
              key={i}
              className="grid md:grid-cols-11 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              data-aos="fade-up"
              data-aos-delay={String(i * 100 + 200)}
            >
              {/* Challenge side — red */}
              <div className="md:col-span-5 p-6 bg-red-50 border border-red-100 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-500 flex-shrink-0">
                      {p.icon}
                    </div>
                    <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest">
                      Challenge {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h4 className="text-gray-900 font-bold text-base leading-snug mb-3">{p.problem}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{p.impact}</p>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-red-100">
                  <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-400 text-[10px] font-medium">Unresolved without the right system</span>
                </div>
              </div>

              {/* Arrow connector */}
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

              {/* Solution side — white */}
              <div className="md:col-span-5 p-6 bg-white border border-gray-100 flex flex-col justify-between gap-4">
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
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(97,97,213,0.07)', border: '1px solid rgba(97,97,213,0.12)' }}
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#6161d5' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-xs font-medium" style={{ color: '#6161d5' }}>{p.solutionStat}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-3xl p-6 md:p-12 mb-12 md:mb-20 border border-gray-100 shadow-sm">
        <div className="text-center mb-12" data-aos="fade-up">
          <span className="chip-badge chip-shine mb-3">How It Works</span>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">From Nervous to Interview-Ready in 4 Steps</h3>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">A structured path that takes you from your first practice session to your next job offer.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => {
            const isActive = activeStep === i
            const lineFilled = activeStep > i
            return (
              <div key={i} className="relative" data-aos="fade-up" data-aos-delay={String(i * 100 + 200)}>
                {/* Animated connector line — starts at right edge of badge, spans to left edge of next badge */}
                {i < steps.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-7 z-0"
                    style={{ left: 'calc(50% + 1.75rem)', width: 'calc(100% - 2rem)' }}
                  >
                    <div className="relative w-full h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(97,97,213,0.2)' }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: lineFilled ? '100%' : '0%',
                          background: 'linear-gradient(90deg, #6161d5, #2A3A6A, #00127f)',
                          transition: resetting ? 'width 100ms ease-in' : 'width 600ms ease-out',
                        }}
                      />
                    </div>
                  </div>
                )}
                {/* Step content */}
                <div
                  className={`relative z-10 ${
                    isActive ? '-translate-y-2 scale-[1.03] opacity-100' : 'translate-y-0 scale-100 opacity-70'
                  }`}
                  style={{
                    transition: 'transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 700ms ease',
                  }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center font-extrabold text-lg mb-4 mx-auto">
                    <span style={{
                      background: 'linear-gradient(135deg, #6161d5, #2A3A6A, #00127f)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      {s.num}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-base mb-2 text-center">{s.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed text-center">{s.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Outcome-Driven Features */}
      <div className="mb-12 md:mb-20">
        <div className="text-center mb-12" data-aos="fade-up">
          <span className="chip-badge chip-shine mb-3">What You Gain</span>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Every Feature Drives a Real Outcome</h3>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">Not just tools — transformations. Here&apos;s what each feature does for your career.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 group"
              data-aos="fade-up" data-aos-delay={String((i % 3) * 100 + 200)}
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h4 className="font-bold text-gray-900 text-base mb-2 group-hover:text-blue-600 transition-colors duration-300">{f.title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Before vs After */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-6 md:p-12 mb-12 md:mb-20 border border-gray-100">
        <div className="text-center mb-12" data-aos="fade-up">
          <span className="chip-badge chip-shine mb-3">Transformation</span>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Before Kommon School vs After</h3>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">Real candidates. Real change. Here&apos;s what shifts when you practice with AI.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div data-aos="fade-right">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-sm font-bold text-red-600 uppercase tracking-wider">Before</span>
            </div>
            <div className="space-y-3">
              {beforeAfter.map((b, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-red-100 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-2" />
                  <p className="text-gray-600 text-sm leading-snug">{b.before}</p>
                </div>
              ))}
            </div>
          </div>
          <div data-aos="fade-left">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-bold text-green-600 uppercase tracking-wider">After</span>
            </div>
            <div className="space-y-3">
              {beforeAfter.map((b, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-green-100 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-2" />
                  <p className="text-gray-700 text-sm font-medium leading-snug">{b.after}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
