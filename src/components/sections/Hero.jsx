import { Link } from 'react-router-dom'

const stats = [
  { value: '27+', label: 'AI Parameters' },
  { value: '10K+', label: 'Students Trained' },
  { value: '94%', label: 'Placement Rate' },
]

export default function Hero() {
  return (
    <section className="relative min-h-screen hero-bg-animated overflow-hidden flex items-center pt-16">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Radial glow — top-left ambient light */}
        <div
          className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
        />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-6xl mx-auto text-center">

          <div data-aos="fade-up" data-aos-delay="100">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
              Transform the Way You{' '}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
                Prepare for{' '}
              </span>
              <span className="text-shine">Interviews</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-5xl mx-auto leading-relaxed">
              Step into every interview fully prepared. Practice with AI-powered mock interviews, sharpen your communication, and receive real-time, data-driven feedback — all in one seamless platform designed to accelerate your career growth.
            </p>
          </div>

          <div
            className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 mb-8 mt-8 max-w-xl mx-auto text-left"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm mb-0.5">Interview with AI is Now Live</div>
              <div className="text-gray-400 text-xs leading-relaxed">
                Practice with AI-powered mock interviews and receive real-time, data-driven feedback designed to accelerate your career growth.
              </div>
            </div>
          </div>

          <div
            className="flex flex-wrap items-center justify-center gap-4 mb-10"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <Link
              to="/contact"
              className="px-8 py-4 rounded-full bg-white text-[#1A1A2E] font-bold text-sm shadow-xl hover:bg-white/90 hover:scale-105 hover:-translate-y-0.5 transition-all duration-300"
            >
              Start Practicing Now
            </Link>
            <Link
              to="/solutions"
              className="px-8 py-4 rounded-full border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 hover:border-white/50 transition-all duration-300"
            >
              Explore Solutions
            </Link>
          </div>

          <div
            className="flex items-center justify-center gap-8 sm:gap-14 pt-6 border-t border-white/10 max-w-md mx-auto"
            data-aos="fade-up"
            data-aos-delay="400"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="group cursor-default text-center">
                <div className="text-2xl font-extrabold text-white group-hover:scale-110 transition-transform duration-200">{stat.value}</div>
                <div className="text-gray-400 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          <p
            className="mt-6 text-gray-500 text-xs"
            data-aos="fade-up"
            data-aos-delay="500"
          >
            Powered by <span className="text-gray-300 font-medium">Kommon School</span> | Brought to you by{' '}
            <span className="text-gray-300 font-medium">Sumago Infotech Pvt Ltd</span>
          </p>

        </div>
      </div>
    </section>
  )
}
