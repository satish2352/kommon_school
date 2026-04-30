import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEnrollModal } from '../../context/EnrollModalContext'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Solutions', to: '/solutions' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Get in Touch', to: '/contact' },
]

const institutionsLink = { label: 'Institutions', to: '/institutions' }

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { open: openEnroll } = useEnrollModal()

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100' : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-bold text-gray-900">Kommon School</span>
              <span className="block text-[10px] text-gray-400 font-medium -mt-0.5">AI Interview Practice</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'text-[#1A1A2E] bg-gray-100 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right cluster — Institutions (separate) + CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={institutionsLink.to}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-1.5 px-5 py-2 rounded-full border-2 border-indigo-200 text-sm font-bold overflow-hidden hover:border-transparent hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #6161d5, #1E2448 30%, #2A3A6A 58%, #00127f 82%, #08081c)' }}
              />
              <span className="relative bg-gradient-to-r from-indigo-600 to-blue-700 bg-clip-text text-transparent group-hover:text-white transition-colors duration-300">
                For Institutions
              </span>
              <svg className="relative w-3.5 h-3.5 text-indigo-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
            <button
              onClick={openEnroll}
              className="btn-gradient-cta px-5 py-2.5 rounded-full text-white font-semibold text-sm shadow hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 transition-all duration-300"
            >
              Enroll Now
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg animate-[fadeDown_0.2s_ease_forwards]">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#1A1A2E] bg-gray-100 font-semibold'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* Institutions — separated */}
            <div className="pt-2 mt-2 border-t border-gray-100">
              <a
                href={institutionsLink.to}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold border-2 border-indigo-200 overflow-hidden hover:border-transparent hover:shadow-lg transition-all duration-300"
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(135deg, #6161d5, #1E2448 30%, #2A3A6A 58%, #00127f 82%, #08081c)' }}
                />
                <span className="relative bg-gradient-to-r from-indigo-600 to-blue-700 bg-clip-text text-transparent group-hover:text-white transition-colors duration-300">
                  For Institutions
                </span>
                <svg className="relative w-4 h-4 text-indigo-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>

            <div className="pt-2 pb-1">
              <button
                onClick={() => { setMenuOpen(false); openEnroll() }}
                className="btn-gradient-cta block w-full text-center px-5 py-3 rounded-xl text-white font-semibold text-sm shadow transition-all duration-200"
              >
                Enroll Now
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
