import SectionWrapper from '../common/SectionWrapper'

const benefits = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Perform with Confidence in Every Interview',
    description: 'Eliminate hesitation and gain clarity through realistic, interactive interview simulations.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Elevate Your Communication Skills',
    description: 'Structure your answers effectively, refine your tone, and deliver responses with confidence and precision.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    title: 'Flexible Learning That Fits Your Schedule',
    description: 'Access interview practice anytime with an AI coach that adapts to your pace and availability.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    title: 'Understand Your Performance Clearly',
    description: 'Identify your strengths and improvement areas with detailed reports and actionable insights after every session.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Prepare for Roles That Matter to You',
    description: 'Practice for specific job roles across industries with tailored interview scenarios and customizable interviewer styles.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Follow a Clear Path to Success',
    description: 'Stay consistent with guided learning journeys designed to help you progress from beginner to interview-ready professional.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
]

export default function Benefits() {
  return (
    <SectionWrapper bg="subtle">
      <div className="text-center mb-14" data-aos="fade-up">
        <div className="chip-badge chip-shine mb-4">
          Why Choose Kommon AI
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Why Choose Kommon AI
        </h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
          Designed to mirror real interview environments, Kommon AI helps you build confidence, improve communication, and track measurable progress — ensuring you're always one step ahead.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, i) => (
          <div
            key={benefit.title}
            className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 hover:border-indigo-100 transition-all duration-300 cursor-default h-full"
            data-aos="fade-up"
            data-aos-delay={String((i % 3) * 100 + 100)}
          >
            <div className={`w-12 h-12 ${benefit.bg} ${benefit.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
              {benefit.icon}
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-indigo-700 transition-colors duration-200 leading-snug">{benefit.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{benefit.description}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
