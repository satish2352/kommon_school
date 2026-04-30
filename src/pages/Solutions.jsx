import { useSearchParams } from 'react-router-dom'
import SectionWrapper from '../components/common/SectionWrapper'
import IndividualsSection from '../components/sections/IndividualsSection'
import InstitutionsSection from '../components/sections/InstitutionsSection'
import CTA from '../components/sections/CTA'

export default function Solutions() {
  const [searchParams] = useSearchParams()
  const isInstitutions = searchParams.get('tab') === 'institutions'

  return (
    <>
      {/* Page Hero */}
      <section className="relative hero-bg-animated overflow-hidden pt-24 md:pt-32 pb-14 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {isInstitutions ? (
            <>
              <div data-aos="fade-up" data-aos-delay="0" className="chip-shine inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-semibold mb-5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Institutions
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
                AI Communication Training for Higher Education
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="text-gray-300 text-lg max-w-xl mx-auto leading-relaxed">
                Scale placement readiness and faculty development across every batch — with real-time dashboards, compliance reporting, and measurable outcomes.
              </p>
              <div data-aos="fade-up" data-aos-delay="300" className="mt-8 flex flex-wrap justify-center gap-3">
                {[
                  { label: 'Engineering Colleges', icon: '🏛️' },
                  { label: 'MBA Institutes', icon: '📊' },
                  { label: 'Universities', icon: '🎓' },
                  { label: 'Polytechnics', icon: '🔧' },
                  { label: 'Nursing Colleges', icon: '🏥' },
                  { label: 'Law Schools', icon: '⚖️' },
                  { label: 'Training Centres', icon: '🏢' },
                  { label: 'Placement Cells', icon: '🎯' },
                ].map((inst) => (
                  <span
                    key={inst.label}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/80 text-sm font-medium hover:bg-white/20 hover:border-white/30 transition-all duration-200"
                  >
                    <span>{inst.icon}</span>
                    {inst.label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <div data-aos="fade-up" data-aos-delay="0" className="chip-shine inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-semibold mb-5">
                Individuals
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
                AI Interview Practice Built for Every Goal
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="text-gray-300 text-lg max-w-xl mx-auto leading-relaxed">
                Practice real interview scenarios, receive instant AI feedback, and follow a personalized roadmap — built for individuals who want to walk into every interview ready.
              </p>
              <div data-aos="fade-up" data-aos-delay="300" className="mt-8 flex flex-wrap justify-center gap-3">
                {[
                  { label: 'Students', icon: '🎓' },
                  { label: 'Fresh Graduates', icon: '👨‍💼' },
                  { label: 'Job Seekers', icon: '🔍' },
                  { label: 'Working Professionals', icon: '💼' },
                  { label: 'Career Switchers', icon: '🔄' },
                  { label: 'MBA Aspirants', icon: '📈' },
                ].map((persona) => (
                  <span
                    key={persona.label}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/80 text-sm font-medium hover:bg-white/20 hover:border-white/30 transition-all duration-200"
                  >
                    <span>{persona.icon}</span>
                    {persona.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Section Content */}
      <SectionWrapper bg="gray" className="pt-10">
        {isInstitutions ? <InstitutionsSection /> : <IndividualsSection />}
      </SectionWrapper>

      <CTA
        heading={isInstitutions ? 'Scale Communication Training Across Your Campus' : 'Stop Guessing. Start Practicing. Start Succeeding.'}
        subheading={isInstitutions
          ? 'Book a platform walkthrough with our institutional team and see measurable results in weeks.'
          : "Don't leave your interview success to chance. With Kommon AI, you get structured practice, expert-level feedback, and a clear path to improvement."}
        ctaLabel={isInstitutions ? 'Talk to Our Team' : 'Enroll Now'}
        ctaTo={isInstitutions ? '/contact' : '/contact'}
        secondaryLabel={isInstitutions ? null : 'See Pricing'}
      />
    </>
  )
}
