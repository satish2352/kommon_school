/**
 * PaymentModal — thin standalone wrapper around PaymentFlow.
 *
 * Kept for any future standalone use. If EnrollModal is the only caller
 * it delegates to PaymentFlow internally for the single-modal flow, but
 * this file remains here as a standalone overlay for other entry points.
 *
 * Props:
 *   isOpen     — boolean
 *   enrollment — { id, enrollmentId, name, email, phone }
 *   onClose    — () => void
 */

import { useEffect } from 'react'
import PaymentFlow from './PaymentFlow'

export default function PaymentModal({ isOpen, enrollment, onClose }) {
  // Body scroll lock — owned by this standalone modal wrapper
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Complete your enrollment</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Inner payment flow — no overlay, no scroll lock (parent owns those) */}
        <PaymentFlow
          enrollment={enrollment}
          onSuccess={() => {
            // In standalone mode, success just keeps the success screen visible.
            // The user then clicks "Done" which calls onClose via PaymentFlow's onClose.
          }}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
