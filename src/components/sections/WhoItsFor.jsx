import { Link } from 'react-router-dom'
import SectionWrapper from '../common/SectionWrapper'

export default function WhoItsFor() {
  return (
    <SectionWrapper bg="white">
      <div className="text-center mb-14" data-aos="fade-up">
        <div className="chip-badge chip-shine mb-4">
          Who It&apos;s For
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          AI Interview Practice for Every Stage of Your Career
        </h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
          Whether you're a student preparing for placements, a job seeker targeting your dream role, or a professional aiming for the next level — Kommon AI is built for you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 md:gap-8">
        {/* Individuals */}
        <div
          className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 h-full"
          data-aos="fade-right"
          data-aos-delay="100"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:shadow-blue-300/50 transition-all duration-300">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">For Individuals</h3>
          <p className="text-gray-600 mb-5 leading-relaxed">
            Practice AI-powered mock interviews anytime, get instant performance feedback, and follow a personalized roadmap to walk into every interview with confidence.
          </p>
          <ul className="space-y-2.5 mb-6">
            {[
              'Practice HR, technical & managerial interviews',
              'Get instant AI feedback after every session',
              'Receive detailed self-coaching reports',
              'Follow a personalized improvement roadmap',
            ].map((item, i) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-700" style={{ transitionDelay: `${i * 60}ms` }}>
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <Link
            to="/contact"
            className="btn-gradient-cta inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm shadow hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 transition-all duration-300"
          >
            Start Practicing Now
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Institutions */}
        <div
          className="group bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 h-full"
          data-aos="fade-left"
          data-aos-delay="200"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:shadow-purple-300/50 transition-all duration-300">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">For Institutions</h3>
          <p className="text-gray-600 mb-5 leading-relaxed">
            Deliver AI-powered interview practice and communication training at scale with advanced analytics, dashboards, and measurable performance insights.
          </p>
          <ul className="space-y-2.5 mb-6">
            {[
              'Batch analytics dashboard for all students',
              'Scalable AI training across entire cohorts',
              'Per-student performance and progress tracking',
              'NEP, NAAC, OBE-aligned reporting',
            ].map((item, i) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-700" style={{ transitionDelay: `${i * 60}ms` }}>
                <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <a
            href="/institutions"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[#1A1A2E] text-[#1A1A2E] font-semibold text-sm hover:bg-[#1A1A2E] hover:text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Explore the Platform
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </SectionWrapper>
  )
}
