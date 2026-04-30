import { Link } from 'react-router-dom'


const productLinks = [
  { label: 'Home', to: '/' },
  { label: 'Solutions', to: '/solutions' },
  { label: 'Pricing', to: '/pricing' },
]

const companyLinks = [
  { label: 'About Us', to: '/contact' },
  { label: 'Get in Touch', to: '/contact' },
]

const legalLinks = [
  { label: 'Privacy Policy', to: '/contact' },
  { label: 'Terms of Service', to: '/contact' },
  { label: 'Cookie Policy', to: '/contact' },
]

export default function Footer() {
  return (
    <footer className="bg-[#1A1A2E] text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Institutional highlight — clickable banner */}
        <a
          href="/institutions"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block mb-12 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1E2448] via-[#16213E] to-[#0d1b3e] p-5 sm:p-6 hover:border-indigo-400/40 hover:shadow-2xl hover:shadow-indigo-900/30 transition-all duration-300"
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-400" />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm sm:text-base mb-1">
                Now Open for Institutional Partnerships
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Bring AI-led placement training and faculty enablement to your college or university — explore the platform built for institutions.
              </p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </a>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 items-start">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-white font-bold text-sm">Kommon School AI</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI-powered mock interviews with instant feedback and a personalized roadmap — for students, job seekers, and working professionals.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Product</h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-gray-400 hover:text-white text-sm transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-gray-400 hover:text-white text-sm transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-gray-400 hover:text-white text-sm transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs text-center sm:text-left">
            © {new Date().getFullYear()} Sumago Infotech Pvt Ltd. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs text-center sm:text-right">
            Powered by <span className="text-gray-300 font-medium">Kommon School</span> | Brought to you by{' '}
            <span className="text-gray-300 font-medium">Sumago Infotech Pvt Ltd</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
