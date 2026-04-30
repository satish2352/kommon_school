import SectionWrapper from '../common/SectionWrapper'

const metrics = [
  { label: 'Interaction Specific', value: '86', change: '+10%', color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Speech Mechanics', value: '79', change: '+5%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Language Accuracy', value: '83', change: '+8%', color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Context & Structure', value: '77', change: '+12%', color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Persona & Impact', value: '85', change: '+6%', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Transcript Level', value: '74', change: '+15%', color: 'text-teal-600', bg: 'bg-teal-50' },
]

const parameters = [
  { label: 'Interaction', score: 86, color: 'bg-blue-500' },
  { label: 'Speech', score: 79, color: 'bg-emerald-500' },
  { label: 'Language', score: 83, color: 'bg-purple-500' },
  { label: 'Context', score: 77, color: 'bg-orange-500' },
  { label: 'Persona', score: 85, color: 'bg-indigo-500' },
  { label: 'Transcript', score: 74, color: 'bg-teal-500' },
]

export default function ProductDemo() {
  return (
    <SectionWrapper bg="white">
      <div className="text-center mb-14" data-aos="fade-up">
        <div className="chip-badge chip-shine mb-4">
          AI Performance Dashboard
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">See Your Performance. Understand Your Gap.</h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Every session generates a rich analytics report — scored across 27+ AI parameters so you know exactly where to improve.
        </p>
      </div>

      {/* Metrics strip — full width */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12" data-aos="fade-up" data-aos-delay="100">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`${m.bg} rounded-xl p-4 hover:scale-105 hover:shadow-md transition-all duration-300 cursor-default`}
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <div className={`text-xl font-extrabold ${m.color} mb-1`}>{m.value}</div>
            <div className="text-gray-700 text-xs font-medium mb-1">{m.label}</div>
            <div className="text-green-600 text-xs font-semibold">{m.change} vs last session</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left: Dashboard UI mockup */}
        <div className="relative" data-aos="fade-right" data-aos-delay="100">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-2xl hover:shadow-indigo-500/10 transition-shadow duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-white font-semibold text-sm">Mock Interview #7</div>
                <div className="text-gray-400 text-xs mt-0.5">Product Manager Role · 18 min session</div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-300 text-xs font-medium">Analysis Complete</span>
              </div>
            </div>

            {/* Score ring + bars */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
              <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="38" fill="none" stroke="#374151" strokeWidth="8" />
                    <circle cx="48" cy="48" r="38" fill="none"
                      stroke="url(#heroGrad2)"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 38 * 0.82} ${2 * Math.PI * 38 * 0.18}`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="heroGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white font-extrabold text-2xl leading-none">82</span>
                    <span className="text-gray-400 text-[10px]">/ 100</span>
                  </div>
                </div>
                <div className="text-gray-300 text-xs font-medium mt-2">Overall Score</div>
              </div>

              <div className="col-span-2 flex flex-col justify-center gap-2">
                {parameters.map((p) => (
                  <div key={p.label} className="flex items-center gap-3">
                    <span className="text-gray-400 text-[10px] w-16 flex-shrink-0">{p.label}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${p.color} transition-all duration-700`}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                    <span className="text-gray-300 text-[10px] w-6 text-right">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight card */}
            <div className="bg-blue-600/15 border border-blue-500/25 rounded-xl p-4 mb-4">
              <div className="text-blue-300 text-xs font-semibold mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Insight
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                You maintained strong eye contact and demonstrated structured thinking. Reduce filler words (&quot;um&quot;, &quot;like&quot;) to push clarity score above 90.
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {['Communication +12%', 'Confidence +8%', 'Pacing Improved'].map((tag) => (
                <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-gray-700 text-gray-300 font-medium hover:bg-gray-600 transition-colors duration-200 cursor-default">{tag}</span>
              ))}
            </div>
          </div>

          {/* Mobile card */}
          <div className="absolute -bottom-6 -right-4 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 hidden sm:block hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-gray-500 text-[10px] font-medium mb-2">Mobile Access</div>
            <div className="space-y-1.5">
              {[['Score', '82'], ['Sessions', '7'], ['Streak', '4d']].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400 text-xs">{k}</span>
                  <span className="text-gray-900 text-xs font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Description + Features */}
        <div data-aos="fade-left" data-aos-delay="200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">27+ AI Performance Parameters</h3>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Our AI engine analyzes everything — not just what you say, but <em>how</em> you say it. From micro-expressions to tonal shifts, every nuance is captured.
          </p>

          <div className="space-y-4">
            {[
              { icon: '📋', title: 'Self-Coaching Reports', desc: 'Detailed breakdown of each session with actionable improvement areas.' },
              { icon: '🗺️', title: 'Guided Improvement Roadmap', desc: 'AI-curated week-by-week roadmap based on your current performance gaps.' },
              { icon: '📈', title: 'Progress Tracking', desc: 'See how you improve across multiple sessions with trend analysis.' },
            ].map((item, i) => (
              <div
                key={item.title}
                className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-default group"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="text-2xl flex-shrink-0 mt-0.5 group-hover:scale-125 transition-transform duration-300">{item.icon}</div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors duration-200">{item.title}</div>
                  <div className="text-gray-500 text-sm mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
