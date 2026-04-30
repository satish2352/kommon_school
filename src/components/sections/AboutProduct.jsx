import SectionWrapper from '../common/SectionWrapper'

const capabilities = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    label: 'Tailored Interview Simulations',
    desc: 'Create personalized interview experiences aligned with your role, industry, and skill level.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: 'Advanced Performance Analytics',
    desc: 'Track your improvement with in-depth performance metrics and actionable feedback.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    label: 'Voice & Communication Analysis',
    desc: 'Enhance your speaking clarity, tone, and confidence using AI-powered voice insights.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    label: 'Diverse Interview Formats',
    desc: 'Practice across HR, technical, managerial, and leadership interview scenarios.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    label: 'Resume-Driven Question Generation',
    desc: 'Upload your resume and receive highly relevant, personalized interview questions.',
  },
]

export default function AboutProduct() {
  return (
    <SectionWrapper bg="gray">

      {/* ── Section Header ── */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-end mb-10 lg:mb-14" data-aos="fade-up">
        <div>
          <div className="chip-badge chip-shine mb-5">Powerful Features</div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            Everything You Need to Master Interviews
          </h2>
        </div>
        <div className="lg:pb-1">
          <p className="text-gray-500 text-lg leading-relaxed">
            A complete AI interview preparation platform — practice with realistic simulations, get data-driven feedback, and follow a structured roadmap designed to accelerate your career growth.
          </p>
        </div>
      </div>

      {/* ── Live Dashboard Preview ── */}
      <div className="mb-14 lg:mb-20">
        <div className="relative max-w-3xl mx-auto px-2 sm:px-6" data-aos="fade-up">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 hover:shadow-3xl transition-shadow duration-500">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="text-gray-400 text-xs">AI Roleplay Dashboard</div>
              </div>

              {/* Overall score ring */}
              <div className="flex items-center gap-4 sm:gap-6 mb-5">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#1f2937" strokeWidth="8" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke="url(#scoreGradFeatures)" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 32 * 0.82} ${2 * Math.PI * 32 * 0.18}`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="scoreGradFeatures" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white font-bold text-lg leading-none">82</span>
                    <span className="text-gray-400 text-[9px]">Score</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm mb-3">Communication Breakdown</div>
                  {[
                    { label: 'Clarity', score: 88, color: 'from-blue-500 to-blue-400' },
                    { label: 'Confidence', score: 75, color: 'from-indigo-500 to-purple-400' },
                    { label: 'Tone', score: 82, color: 'from-emerald-500 to-teal-400' },
                    { label: 'Delivery', score: 79, color: 'from-orange-500 to-amber-400' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 mb-2">
                      <span className="text-gray-400 text-[10px] w-20 flex-shrink-0">{item.label}</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5 min-w-0">
                        <div
                          className={`h-1.5 rounded-full bg-gradient-to-r ${item.color}`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      <span className="text-gray-300 text-[10px] w-6 flex-shrink-0">{item.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Feedback card */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-blue-300 text-xs font-semibold mb-1">AI Coaching Insight</div>
                    <div className="text-gray-300 text-xs leading-relaxed">
                      Your tone improved 12% vs last session. Reduce filler words and sharpen your answer structure.
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                {['AI Roleplay', 'Self-Coaching', 'Performance Analytics'].map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-md bg-gray-700/60 text-gray-300 text-[10px] hover:bg-gray-600/60 transition-colors duration-200">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <div className="hidden sm:flex absolute -bottom-4 -left-2 lg:-left-6 bg-white rounded-xl shadow-xl p-3 items-center gap-2 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-900">Report Ready</div>
              <div className="text-[10px] text-gray-400">Self-coaching report generated</div>
            </div>
          </div>

          <div className="hidden sm:block absolute -top-4 -right-2 lg:-right-4 bg-white rounded-xl shadow-xl p-3 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-xs font-semibold text-gray-900 mb-1">27+ Parameters</div>
            <div className="flex gap-1">
              {[16, 12, 20, 14, 18].map((h, i) => (
                <div key={i} className="w-1.5 rounded-full bg-gradient-to-t from-blue-200 to-blue-600" style={{ height: `${h}px` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Caption — below the dashboard */}
        <div className="text-center max-w-2xl mx-auto mt-12 sm:mt-14" data-aos="fade-up" data-aos-delay="150">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-3">
            Real-Time Performance Insights
          </h3>
          <p className="text-gray-500 text-sm md:text-base leading-relaxed">
            Track clarity, confidence, tone, and delivery — every session decoded into actionable, data-driven feedback.
          </p>
        </div>
      </div>

      {/* ── Capability Cards ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-14 lg:mb-20">
        {capabilities.map((cap, i) => (
          <div
            key={cap.label}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 cursor-default group"
            data-aos="fade-up"
            data-aos-delay={String(i * 80 + 100)}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4"
              style={{ background: 'linear-gradient(135deg, #6161d5, #00127f)' }}
            >
              {cap.icon}
            </div>
            <div className="font-bold text-gray-900 text-sm mb-1.5 group-hover:text-[#6161d5] transition-colors duration-200">
              {cap.label}
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">{cap.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Quote Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-5 py-8 sm:px-8 sm:py-10 text-center"
        style={{ background: 'linear-gradient(135deg, #6161d5, #1E2448 30%, #2A3A6A 58%, #00127f 82%, #08081c)' }}
        data-aos="fade-up"
        data-aos-delay="200"
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative">
          <div className="text-white/30 text-6xl font-serif leading-none mb-2 select-none">&ldquo;</div>
          <p className="text-white text-xl md:text-2xl font-bold italic max-w-2xl mx-auto leading-snug -mt-4">
            Stop guessing. Start practicing. Your next interview offer starts here.
          </p>
        </div>
      </div>

    </SectionWrapper>
  )
}
