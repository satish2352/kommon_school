import InstitutionsSection from '../components/sections/InstitutionsSection'
import InstitutionFooter from '../components/layout/InstitutionFooter'
import { useInstitutionModal } from '../context/InstitutionModalContext'

function InstitutionHeader() {
  const { open } = useInstitutionModal()

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 sm:h-16">

          {/* Left — brand mark */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>

          {/* Center — wordmark */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 select-none whitespace-nowrap">
            <span className="font-extrabold text-xs sm:text-sm text-gray-900 tracking-tight">Kommon AI</span>
            <span className="text-gray-300 font-light text-sm sm:text-base">×</span>
            <span className="font-extrabold text-xs sm:text-sm text-red-600 tracking-tight">Sumago Infotech</span>
          </div>

          {/* Right — CTA (hidden on mobile) */}
          <div className="flex-1 flex justify-end">
            <button
              onClick={open}
              className="btn-gradient-cta hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-sm shadow hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Talk to Our Team
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default function Institution() {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <InstitutionHeader />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
          <InstitutionsSection />
        </div>
      </div>
      <InstitutionFooter />
    </div>
  )
}
