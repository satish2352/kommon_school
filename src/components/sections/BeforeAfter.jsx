import SectionWrapper from '../common/SectionWrapper'

const comparisons = [
  {
    before: 'Nervous, unprepared for unexpected questions',
    after: 'Calm and structured — trained on 100s of scenarios',
  },
  {
    before: 'No idea how you actually come across',
    after: 'Real-time AI feedback on tone, pace, and confidence',
  },
  {
    before: 'Guessing what to improve after each interview',
    after: 'Self-coaching report with exact improvement areas',
  },
  {
    before: 'Scattered preparation with no clear plan',
    after: 'Guided improvement roadmap based on your gaps',
  },
  {
    before: 'Repeating the same mistakes unknowingly',
    after: 'Progress tracked across sessions — see trends',
  },
]

export default function BeforeAfter() {
  return (
    <SectionWrapper bg="white">
      <div className="text-center mb-14" data-aos="fade-up">
        <div className="chip-badge chip-shine mb-4">
          The Transformation
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Before vs After Kommon AI
        </h2>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          The difference between failing an interview and acing it is preparation. Kommon AI makes that preparation structured, measurable, and effective.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Before column */}
          <div data-aos="fade-right">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-sm font-bold text-red-600 uppercase tracking-wider">Before</span>
            </div>
            <div className="space-y-3">
              {comparisons.map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-red-100 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-2" />
                  <p className="text-gray-600 text-sm leading-snug">{item.before}</p>
                </div>
              ))}
            </div>
          </div>

          {/* After column */}
          <div data-aos="fade-left">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-bold text-green-600 uppercase tracking-wider">After Kommon AI</span>
            </div>
            <div className="space-y-3">
              {comparisons.map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-green-100 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-2" />
                  <p className="text-gray-700 text-sm font-medium leading-snug">{item.after}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center" data-aos="fade-up" data-aos-delay="200">
          <p className="text-gray-500 text-sm mb-4">Join thousands who have made the switch</p>
          <a
            href="/contact"
            className="btn-gradient-cta inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 transition-all duration-300"
          >
            Start Your Transformation — Enroll Now
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </SectionWrapper>
  )
}
