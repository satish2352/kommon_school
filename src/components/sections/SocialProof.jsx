import SectionWrapper from '../common/SectionWrapper'

const testimonials = [
  {
    name: 'Rahul Verma',
    role: 'Software Engineer, Infosys',
    avatar: 'RV',
    rating: 5,
    quote: 'I was rejected 4 times before finding Kommon AI. After 3 weeks of daily practice, I cleared my Infosys interview in the first round. The AI feedback on my response structure changed everything.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Sneha Iyer',
    role: 'MBA Student, Symbiosis Pune',
    avatar: 'SI',
    rating: 5,
    quote: 'The mock interviews felt incredibly real — I was nervous even during practice! By the time I sat for my campus placement, I was completely confident. Got placed at HDFC Bank.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    name: 'Arjun Mehta',
    role: 'Fresh Graduate, Delhi',
    avatar: 'AM',
    rating: 5,
    quote: 'I never knew how many filler words I was using until the AI flagged them. After two focused weeks working on that alone, my communication improved dramatically. Interviewers noticed immediately.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Pooja Nair',
    role: 'Team Lead Aspirant, Bangalore',
    avatar: 'PN',
    rating: 5,
    quote: 'I was targeting a team lead role and needed stronger leadership communication. The customized interview scenarios and guided roadmap helped me prepare for exactly those questions. Got the promotion.',
    color: 'from-orange-500 to-amber-600',
  },
  {
    name: 'Karan Sharma',
    role: 'Job Seeker, Pune',
    avatar: 'KS',
    rating: 5,
    quote: 'After months of rejections, I started using Kommon AI for just 15 minutes a day. In 30 days, I had 3 interviews and 2 offers. The structured feedback is unlike anything I had tried before.',
    color: 'from-rose-500 to-pink-600',
  },
  {
    name: 'Divya Krishnan',
    role: 'BCA Graduate, Chennai',
    avatar: 'DK',
    rating: 5,
    quote: 'My college had no proper placement support, so I was on my own. Kommon AI gave me the coaching and roadmap I needed. I landed my first job at a product startup right after graduation.',
    color: 'from-teal-500 to-cyan-600',
  },
]

const logos = ['Infosys', 'TCS', 'Wipro', 'Capgemini', 'HCL', 'Accenture']

function TestimonialCard({ name, role, avatar, rating, quote, color }) {
  return (
    <div className="flex-shrink-0 w-72 sm:w-80 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default mx-2 sm:mx-3">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {avatar}
        </div>
        <div>
          <div className="text-gray-900 font-semibold text-sm">{name}</div>
          <div className="text-gray-400 text-xs">{role}</div>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          {[...Array(rating)].map((_, j) => (
            <svg key={j} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
    </div>
  )
}

export default function SocialProof() {
  const doubled = [...testimonials, ...testimonials]

  return (
    <SectionWrapper bg="gray">
      {/* Heading */}
      <div className="text-center mb-10 md:mb-14" data-aos="fade-up">
        <div className="chip-badge chip-shine mb-4">
          Success Stories
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Real People. Real Growth.
        </h2>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          From students to working professionals — Kommon AI is helping people walk into interviews with confidence and walk out with offers.
        </p>
      </div>

      {/* Auto-scrolling marquee */}
      <div className="mb-10 md:mb-16 -mx-4 sm:-mx-6 lg:-mx-8" data-aos="fade-up" data-aos-delay="100">
        <div className="marquee-wrapper overflow-hidden py-4">
          <div className="marquee-track">
            {doubled.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
      </div>

      {/* Company logos */}
      <div className="text-center" data-aos="fade-up" data-aos-delay="200">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-6">Students placed at</p>
        <div className="flex flex-wrap items-center justify-center gap-5 md:gap-8">
          {logos.map((logo) => (
            <div
              key={logo}
              className="text-gray-400 font-bold text-base tracking-wide hover:text-[#D32F2F] hover:scale-110 transition-all duration-200 cursor-default"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
