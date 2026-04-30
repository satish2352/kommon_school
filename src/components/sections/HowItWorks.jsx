import { useState, useEffect, useRef } from 'react'
import SectionWrapper from '../common/SectionWrapper'

const steps = [
  {
    number: '01',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'Select Your Interview Type & Job Role',
    description: 'Customize your session based on your target role and begin instantly.',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    number: '02',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    title: 'Choose Your Interviewer Style',
    description: 'Simulate real-world scenarios by selecting interviewer personalities relevant to your industry.',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
  {
    number: '03',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Get Instant Performance Feedback',
    description: 'Analyze your responses with detailed scoring, speech evaluation, and behavioral insights.',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  {
    number: '04',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: 'Improve with a Personalized Roadmap',
    description: 'Follow structured recommendations to continuously enhance your communication and performance.',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
]

const CYCLE_MS = 1750

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)
  const [resetting, setResetting] = useState(false)
  const hasLooped = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep(prev => (prev + 1) % steps.length)
    }, CYCLE_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (activeStep === 0) {
      if (!hasLooped.current) {
        hasLooped.current = true
        return
      }
      setResetting(true)
      const t = setTimeout(() => setResetting(false), 150)
      return () => clearTimeout(t)
    }
  }, [activeStep])

  return (
    <SectionWrapper bg="gray">
      <div className="text-center mb-10 md:mb-16" data-aos="fade-up">
        <div className="chip-badge chip-shine mb-4">
          Simple 4-Step Process
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">How Kommon AI Works</h2>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Start improving in just 4 simple steps — from choosing your role to receiving a personalized roadmap.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => {
          const isActive = activeStep === index
          const lineFilled = activeStep > index

          return (
            <div
              key={step.title}
              className="relative"
              data-aos="fade-up"
              data-aos-delay={String(index * 100 + 100)}
            >
              {/* Animated connector — runs between number badges at the top */}
              {index < steps.length - 1 && (
                <div
                  className="hidden lg:block absolute top-6 z-0"
                  style={{ left: 'calc(50% + 1.5rem)', width: 'calc(100% - 1.5rem)' }}
                >
                  <div className="relative w-full h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(97,97,213,0.2)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: lineFilled ? '100%' : '0%',
                        background: 'linear-gradient(90deg, #6161d5, #2A3A6A, #00127f)',
                        transition: resetting ? 'width 100ms ease-in' : 'width 600ms ease-out',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Step number badge — connector runs through its center */}
              <div
                className={`flex justify-center mb-4 relative z-10 transition-all duration-700 ease-out ${
                  isActive ? '-translate-y-1 opacity-100' : 'opacity-60'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-gray-100 flex items-center justify-center font-bold shadow-sm">
                  <span style={{
                    background: 'linear-gradient(135deg, #6161d5, #2A3A6A, #00127f)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: '0.9rem',
                  }}>
                    {step.number}
                  </span>
                </div>
              </div>

              {/* Content card */}
              <div
                className={`bg-white rounded-2xl p-6 shadow-sm border text-center cursor-default ${
                  isActive
                    ? 'border-[#6161d5]/20 shadow-md -translate-y-1 scale-[1.02] opacity-100'
                    : 'border-gray-100 translate-y-0 scale-100 opacity-70'
                }`}
                style={{
                  transition: 'transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 700ms ease, box-shadow 700ms ease, border-color 700ms ease',
                }}
              >
                <div className={`w-12 h-12 rounded-xl ${step.bgColor} flex items-center justify-center ${step.textColor} mx-auto mb-4`}>
                  {step.icon}
                </div>
                <h3 className="text-gray-900 font-bold text-base mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
