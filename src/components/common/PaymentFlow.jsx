/**
 * PaymentFlow — the payment phase state machine extracted from PaymentModal.
 *
 * Renders only the inner content (phases, buttons, status messages).
 * There is NO overlay wrapper, NO z-index, NO body-scroll lock here —
 * those all belong to the parent (EnrollModal or PaymentModal wrapper).
 *
 * Props:
 *   enrollment   — { id, enrollmentId, name, email, phone }
 *   onSuccess    — () => void  — called when setPhase('success') settles and webhook fires
 *   onClose      — () => void  — called when user clicks Close (failed) or Done (success)
 *   selectedPlan — optional plan summary from PlanSelector (displayed above amount)
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPublicPaymentOrder, verifyPublicPayment, getPaymentStatus } from '../../services/enrollmentApi'
import PlanSummaryCard from './PlanSummaryCard'

const RZP_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

// How long (ms) the component can stay in 'paying' before auto-transition to 'check'
const PAYING_TIMEOUT_MS = 90_000

// Max retries for network/timeout errors during verification (not for 4xx API failures)
const MAX_VERIFY_RETRIES = 2

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay)
    const existing = document.querySelector(`script[src="${RZP_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Razorpay))
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')))
      return
    }
    const s = document.createElement('script')
    s.src = RZP_SCRIPT
    s.async = true
    s.onload = () => resolve(window.Razorpay)
    s.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(s)
  })
}

/** Returns true for transient network/timeout failures that are safe to retry. */
function isRetryable(err) {
  if (err instanceof TypeError) return true // fetch network error
  if (err?.code === 'TIMEOUT') return true
  // Only retry if there is no HTTP status (i.e. not a real API response)
  if (err?.status) return false
  return true
}

/** Calls verifyPublicPayment with exponential backoff retries on transient errors. */
async function verifyWithRetry(enrollmentId, payload, maxRetries = MAX_VERIFY_RETRIES) {
  let lastErr
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await verifyPublicPayment(enrollmentId, payload)
    } catch (err) {
      lastErr = err
      // 4xx responses are definitive failures — do not retry
      if (!isRetryable(err)) throw err
      if (attempt < maxRetries) {
        // backoff: 2s, 4s
        await new Promise((r) => setTimeout(r, 2_000 * (attempt + 1)))
      }
    }
  }
  throw lastErr
}

const inr = (paise) =>
  `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

// ---------------------------------------------------------------------------
// Shared UI atoms
// ---------------------------------------------------------------------------

function Spinner({ className = '' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// PaymentFlow — inner content only, no overlay wrapper
// ---------------------------------------------------------------------------
// Phases:
//   loading   — creating the Razorpay order + loading SDK
//   ready     — order ready, "Pay" button shown
//   paying    — Razorpay checkout popup is open
//   verifying — popup closed, calling payment-verify API
//   check     — popup dismissed or timeout; user must confirm whether they paid
//   checking  — actively polling/verifying after user clicks "Yes, I paid"
//   success   — verified OK  (parent receives onSuccess callback)
//   failed    — unrecoverable error

export default function PaymentFlow({ enrollment, onSuccess, onClose, selectedPlan }) {
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)

  // Saved Razorpay handler payload — needed for the 'check' verify path
  const rzpResponseRef = useRef(null)
  // Prevents double-opening the checkout
  const lockRef = useRef(false)
  // Timer ref for the 90-second paying safety timeout
  const payingTimerRef = useRef(null)
  // Keep a stable ref to the current order so webhook callers can access it
  const orderRef = useRef(null)
  // Ref to track if onSuccess has already been called (prevent double-fire)
  const successFiredRef = useRef(false)

  // Sync orderRef whenever order state changes
  useEffect(() => {
    orderRef.current = order
  }, [order])

  // Clear the safety timeout whenever we leave the 'paying' phase
  const clearPayingTimer = useCallback(() => {
    if (payingTimerRef.current) {
      clearTimeout(payingTimerRef.current)
      payingTimerRef.current = null
    }
  }, [])

  // Start the 90-second safety timeout that moves us from 'paying' to 'check'
  const startPayingTimer = useCallback(() => {
    clearPayingTimer()
    payingTimerRef.current = setTimeout(() => {
      // Only act if we are still in 'paying' (could have already transitioned)
      setPhase((prev) => {
        if (prev === 'paying') return 'check'
        return prev
      })
    }, PAYING_TIMEOUT_MS)
  }, [clearPayingTimer])

  // Initialise: create order and load SDK whenever enrollment.id changes
  useEffect(() => {
    if (!enrollment?.id) return
    setPhase('loading')
    setError(null)
    setOrder(null)
    lockRef.current = false
    rzpResponseRef.current = null
    successFiredRef.current = false
    clearPayingTimer()

    ;(async () => {
      try {
        const resp = await createPublicPaymentOrder(enrollment.id)
        const data = resp?.data ?? resp
        if (!data?.razorpayOrderId) throw new Error('Could not create payment order')
        setOrder(data)
        await loadRazorpayScript()
        setPhase('ready')
      } catch (e) {
        setError(e.message || 'Failed to start payment')
        setPhase('failed')
      }
    })()

    return () => {
      clearPayingTimer()
    }
  }, [enrollment?.id, clearPayingTimer])

  // ------------------------------------------------------------------
  // Core verify helper — used by both the normal handler path and the
  // "Yes, I paid" recovery path.
  // ------------------------------------------------------------------
  const runVerify = useCallback(
    async (rzpResponse) => {
      try {
        await verifyWithRetry(enrollment.id, {
          paymentId: order?.paymentId,
          razorpayOrderId: rzpResponse.razorpay_order_id,
          razorpayPaymentId: rzpResponse.razorpay_payment_id,
          razorpaySignature: rzpResponse.razorpay_signature,
        })
        setPhase('success')
        // Notify parent — guard against double-fire
        if (!successFiredRef.current) {
          successFiredRef.current = true
          onSuccess?.()
        }
      } catch (e) {
        setError(e.message || 'Verification failed — your payment may still complete via webhook')
        setPhase('failed')
      } finally {
        lockRef.current = false
      }
    },
    [enrollment, order, onSuccess],
  )

  // ------------------------------------------------------------------
  // "Yes, I paid — check status" handler
  // Used when the Razorpay popup was dismissed but payment may have gone through.
  // ------------------------------------------------------------------
  const handleCheckStatus = useCallback(async () => {
    setPhase('checking')

    // If we captured the Razorpay response (handler did fire but something
    // else stalled), verify using that.
    if (rzpResponseRef.current) {
      await runVerify(rzpResponseRef.current)
      // Webhook is already fired inside runVerify for this branch
      return
    }

    // No handler response available — fall back to polling the payment record
    // via GET /payments/:paymentId using the internal paymentId from the order.
    if (!order?.paymentId) {
      // Truly nothing we can do on the client; the backend webhook will reconcile.
      setError(
        'We could not confirm your payment automatically. ' +
          'Our team will reconcile via webhook and confirm your enrollment by email.',
      )
      setPhase('failed')
      return
    }

    // Poll up to 3 times (immediate + 2 retries with backoff) for a
    // definitive payment status.
    let lastErr
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 3_000 * attempt))
        const result = await getPaymentStatus(order.paymentId)
        const statusRaw = result?.data?.status ?? result?.status ?? ''
        const status = String(statusRaw).toUpperCase()

        if (status === 'SUCCESS' || status === 'PAID' || status === 'CAPTURED') {
          setPhase('success')
          // Notify parent
          if (!successFiredRef.current) {
            successFiredRef.current = true
            onSuccess?.()
          }
          return
        }
        if (
          status === 'FAILED' ||
          status === 'PAYMENT_FAILED' ||
          status === 'CANCELLED'
        ) {
          setError('Your payment was not successful. Please try again.')
          setPhase('failed')
          return
        }
        // Any other status (PENDING, IN_PROGRESS, etc.) — keep polling
        lastErr = null
      } catch (e) {
        lastErr = e
      }
    }

    // After all attempts — still no definitive answer
    if (lastErr) {
      // Network/server error — we genuinely can't tell
      setError(
        'We could not reach the server to confirm your payment. ' +
          'Our team will reconcile via webhook and confirm your enrollment by email.',
      )
    } else {
      // Status still pending — webhook will handle it
      setError(
        'Your payment is still being processed. ' +
          'Our team will confirm your enrollment by email once it settles.',
      )
    }
    setPhase('failed')
  }, [order, runVerify, enrollment, onSuccess])

  // ------------------------------------------------------------------
  // Open Razorpay checkout
  // ------------------------------------------------------------------
  const startCheckout = () => {
    if (lockRef.current || !order || !window.Razorpay) return
    lockRef.current = true
    rzpResponseRef.current = null
    setPhase('paying')
    startPayingTimer()

    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.razorpayOrderId,
      name: 'Kommon School',
      description: `Enrollment ${order.enrollmentId}`,
      prefill: {
        name: enrollment?.name ?? '',
        email: enrollment?.email ?? '',
        contact: enrollment?.phone ?? '',
      },
      theme: { color: '#4f46e5' },

      handler: async (res) => {
        // Razorpay popup closed with a successful payment response.
        clearPayingTimer()
        rzpResponseRef.current = res
        setPhase('verifying')
        await runVerify(res)
      },

      modal: {
        ondismiss: () => {
          // User closed the popup — could be before or after paying.
          clearPayingTimer()
          lockRef.current = false
          setPhase('check')
        },
      },
    })

    rzp.on('payment.failed', (resp) => {
      clearPayingTimer()
      lockRef.current = false
      setError(resp?.error?.description || 'Payment failed')
      setPhase('failed')
    })

    rzp.open()
  }

  // ------------------------------------------------------------------
  // Render — no overlay wrapper, just the inner body content
  // ------------------------------------------------------------------

  return (
    <div className="w-full">
      {/* ── loading ── */}
      {phase === 'loading' && (
        <div className="py-10 text-center">
          <Spinner className="w-8 h-8 text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Preparing your payment…</p>
        </div>
      )}

      {/* ── ready ── */}
      {phase === 'ready' && order && (
        <div>
          {/* Plan summary card — shown when a plan was selected */}
          {selectedPlan && <PlanSummaryCard plan={selectedPlan} />}
          <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 mb-0.5">Enrollment reference</div>
            <div className="font-mono text-sm text-slate-900">{order.enrollmentId}</div>
            <div className="mt-3 text-xs text-slate-500 mb-0.5">Amount due</div>
            <div className="text-2xl font-bold text-slate-900">{inr(order.amount)}</div>
          </div>
          <button
            onClick={startCheckout}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition"
          >
            Pay {inr(order.amount)}
          </button>
          <p className="mt-4 text-center text-xs text-slate-400">
            Secured by Razorpay · Your data is encrypted
          </p>
        </div>
      )}

      {/* ── paying ── */}
      {phase === 'paying' && (
        <div className="py-10 text-center">
          <Spinner className="w-8 h-8 text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-700 font-medium">Razorpay window is open</p>
          <p className="mt-1 text-sm text-slate-400">Complete your payment in the Razorpay window.</p>
        </div>
      )}

      {/* ── verifying ── */}
      {phase === 'verifying' && (
        <div className="py-10 text-center">
          <Spinner className="w-8 h-8 text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-700 font-medium">Verifying your payment…</p>
          <p className="mt-1 text-sm text-slate-400">This usually takes just a moment. Please do not close this window.</p>
        </div>
      )}

      {/* ── check ── user dismissed popup; ask if they paid */}
      {phase === 'check' && (
        <div>
          <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <svg className="w-8 h-8 text-amber-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
            </svg>
            <p className="font-semibold text-slate-800">Did you complete the payment?</p>
            <p className="mt-1 text-sm text-slate-500">
              If you already paid in the Razorpay window before closing it, tap the button below to confirm.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleCheckStatus}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition"
            >
              Yes, I paid — check status
            </button>
            <button
              onClick={() => { setError(null); setPhase('ready') }}
              className="w-full px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            >
              No, try again
            </button>
          </div>
        </div>
      )}

      {/* ── checking ── polling after user confirmed they paid */}
      {phase === 'checking' && (
        <div className="py-10 text-center">
          <Spinner className="w-8 h-8 text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-700 font-medium">Checking payment status…</p>
          <p className="mt-1 text-sm text-slate-400">Please wait — this may take a few seconds.</p>
        </div>
      )}

      {/* ── success ── */}
      {phase === 'success' && (
        <div className="py-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Payment received</h3>
          <p className="mt-2 text-sm text-slate-600">
            We&apos;ll be in touch shortly. Confirmation will reach you on email.
          </p>
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            Done
          </button>
        </div>
      )}

      {/* ── failed ── */}
      {phase === 'failed' && (
        <div>
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
            {error}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
            {order && (
              <button
                onClick={() => { setError(null); setPhase('ready') }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
