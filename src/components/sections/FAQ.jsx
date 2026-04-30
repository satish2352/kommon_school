import { useState } from 'react'
import Reveal from '../common/Reveal'

const faqs = [
  {
    q: 'What is Kommon AI and how does it help with interview preparation?',
    a: 'Kommon AI is an AI-powered interview preparation platform that lets you practice real interview scenarios, enhance your communication skills, and receive instant data-driven feedback. It helps you become job-ready through realistic mock interviews, voice analysis, and a personalized improvement roadmap.',
  },
  {
    q: 'What types of interviews can I practice on Kommon AI?',
    a: 'You can practice HR interviews, technical interviews, managerial interviews, and leadership interviews. You can also customize sessions by selecting job roles, interview formats, and specific interviewer personas to match your target industry.',
  },
  {
    q: 'How does the AI feedback work?',
    a: 'After each session, Kommon AI analyzes your speech clarity, tone and confidence, answer structure, and relevance of responses. You receive a detailed self-coaching report with scores, behavioral insights, and actionable improvement suggestions.',
  },
  {
    q: 'What is a Self-Coaching Report?',
    a: 'A Self-Coaching Report is a detailed performance breakdown generated after every session. It includes scores and evaluation metrics, a speech breakdown, behavioral insights, and personalized improvement suggestions — so you always know exactly what to work on next.',
  },
  {
    q: 'Is there a trial plan available?',
    a: 'Yes. The Trial plan gives you access to 2 mock interview sessions, 1 guided learning roadmap, and email & WhatsApp support at an introductory price. It\'s the perfect way to explore the platform before upgrading.',
  },
  {
    q: 'Can I upload my resume to get personalized questions?',
    a: 'Yes. Once you upload your resume, the platform generates personalized interview questions based on your background and target role — mirroring what real interviewers are likely to ask you.',
  },
  {
    q: 'How soon will I see improvement?',
    a: 'Most users see measurable improvement within 4–6 sessions. The AI-generated guided roadmap personalizes your journey based on your specific weak areas, making progress faster and more targeted than traditional preparation methods.',
  },
  {
    q: 'Can I use Kommon AI on my phone or tablet?',
    a: 'Yes. Kommon AI is fully compatible with mobile, tablet, and desktop devices and is accessible 24/7 — so you can practice at your convenience, anytime and anywhere.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <Reveal key={i} variant="up" delay={Math.min(i * 50, 300)}>
            <div
              className={`border rounded-2xl overflow-hidden bg-white transition-all duration-300 ${
                openIndex === i
                  ? 'border-green-500/30 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left group"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className={`font-semibold text-sm pr-4 transition-colors duration-200 ${openIndex === i ? 'text-green-700' : 'text-gray-900 group-hover:text-green-700'}`}>
                  {faq.q}
                </span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  openIndex === i
                    ? 'bg-green-500 text-white rotate-180'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-green-50 group-hover:text-green-600'
                }`}>
                  <svg className="w-3.5 h-3.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: openIndex === i ? '500px' : '0px', opacity: openIndex === i ? 1 : 0 }}
              >
                <div className="px-6 pb-5">
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
