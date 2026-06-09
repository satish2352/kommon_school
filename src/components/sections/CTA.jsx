import { Link } from 'react-router-dom'
import { useBranding } from '../../context/BrandingContext'
import { useEnrollModal } from '../../context/EnrollModalContext'

export default function CTA({
  heading = 'Stop Guessing. Start Practicing. Start Succeeding.',
  subheading = "Don't leave your interview success to chance. With Kommon AI, you get structured practice, expert-level feedback, and a clear path to improvement — all in one place.",
  ctaLabel = 'Start Your First AI Interview Today',
  ctaTo = '/contact',
  secondaryLabel = 'See Pricing',
  secondaryTo = '/pricing',
}) {
  const { open: openEnroll } = useEnrollModal()
  const { brandName } = useBranding()
  return (
    <section className="relative overflow-hidden bg-[#1A1A2E] py-16 md:py-24">
      {/* Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div
          className="chip-shine inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-semibold mb-6"
          data-aos="fade-up"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Interview with AI is Now Live
        </div>

        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          {heading}
        </h2>

        <p
          className="text-blue-100/80 text-lg mb-10 max-w-xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          {subheading}
        </p>

        <div
          className="flex flex-wrap items-center justify-center gap-4"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          {ctaLabel === 'Enroll Now' ? (
            <button
              onClick={openEnroll}
              className="px-8 py-4 rounded-full bg-white text-[#1A1A2E] font-bold text-sm shadow-xl hover:bg-white/90 hover:scale-105 hover:-translate-y-0.5 transition-all duration-300"
            >
              {ctaLabel}
            </button>
          ) : (
            <Link
              to={ctaTo}
              className="px-8 py-4 rounded-full bg-white text-[#1A1A2E] font-bold text-sm shadow-xl hover:bg-white/90 hover:scale-105 hover:-translate-y-0.5 transition-all duration-300"
            >
              {ctaLabel}
            </Link>
          )}
          {secondaryLabel && (
            <Link
              to={secondaryTo}
              className="px-8 py-4 rounded-full border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/15 hover:border-white/60 transition-all duration-300"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>

        <p
          className="mt-6 text-blue-200/60 text-xs"
          data-aos="fade-up"
          data-aos-delay="400"
        >
          Powered by <span className="text-white/70 font-medium">{brandName}</span> | Brought to you by{' '}
          <span className="text-white/70 font-medium">Sumago Infotech Pvt Ltd</span>
        </p>
      </div>
    </section>
  )
}
