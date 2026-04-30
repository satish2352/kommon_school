import { Link } from 'react-router-dom'
import PricingTable from '../components/sections/PricingTable'
import FAQ from '../components/sections/FAQ'
import CTA from '../components/sections/CTA'

const guarantees = [
  { icon: '🔒', label: 'Secure Payments', desc: 'Razorpay protected' },
  { icon: '❌', label: 'No Hidden Fees', desc: 'Pay exactly what you see' },
  { icon: '🔄', label: 'Cancel Anytime', desc: 'No lock-in contracts' },
  { icon: '⚡', label: 'Instant Access', desc: 'Start right after enrollment' },
]

export default function Pricing() {
  return (
    <>
      {/* Hero */}
      <section className="relative hero-bg-animated overflow-hidden pt-24 md:pt-32 pb-14 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div data-aos="fade-up" data-aos-delay="0" className="chip-shine inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-semibold mb-5">
            Simple Pricing
          </div>
          <h1 data-aos="fade-up" data-aos-delay="100" className="text-4xl md:text-5xl font-extrabold text-white mb-5">
            Pricing That Fits Your Growth
          </h1>
          <p data-aos="fade-up" data-aos-delay="200" className="text-gray-300 text-lg max-w-xl mx-auto mb-8">
            Start small, grow big. Begin your journey with introductory access and upgrade as your interview confidence grows.
          </p>
          <div data-aos="fade-up" data-aos-delay="300" className="flex flex-wrap items-center justify-center gap-6">
            {guarantees.map((g) => (
              <div key={g.label} className="flex items-center gap-2 text-white/80">
                <span className="text-lg">{g.icon}</span>
                <div className="text-left">
                  <div className="text-xs font-semibold">{g.label}</div>
                  <div className="text-[10px] text-gray-400">{g.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing table */}
      <section className="bg-gray-50 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricingTable />
        </div>
      </section>

      {/* Institute Plan CTA */}
      <section className="bg-white py-12 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 sm:p-10 border border-indigo-100 text-center">
            <div className="chip-badge chip-shine mb-4">
              For Institutions
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Placement Readiness at Scale
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              The Institute plan is custom-built for colleges, training centers, and placement cells. Get batch analytics, student performance dashboards, and a dedicated success manager — sized to your cohort.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
              {[
                { icon: '👥', label: 'Unlimited students' },
                { icon: '📊', label: 'Batch analytics' },
                { icon: '🎯', label: 'Custom integrations' },
              ].map((f) => (
                <div key={f.label} className="flex items-center justify-center gap-2 text-gray-700 text-sm font-medium">
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>

            <Link
              to="/contact"
              className="btn-gradient-cta inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Talk to Our Team
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h2>
            <p className="text-gray-500">Everything you need to know about Kommon AI interview preparation.</p>
          </div>
          <FAQ />
        </div>
      </section>

      <CTA
        heading="Still Have Questions?"
        subheading="Our team is happy to walk you through the platform and help you pick the right plan."
        ctaLabel="Enroll Now"
        secondaryLabel="Contact Us"
        secondaryTo="/contact"
      />
    </>
  )
}
