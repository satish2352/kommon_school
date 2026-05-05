import { useEffect, useRef, useState } from 'react'
import { createPublicPaymentOrder, verifyPublicPayment } from '../../services/enrollmentApi'

const RZP_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

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

const inr = (paise) =>
  `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export default function PaymentModal({ isOpen, enrollment, onClose }) {
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)
  const lockRef = useRef(false)

  useEffect(() => {
    if (!isOpen || !enrollment?.id) return
    setPhase('loading'); setError(null); setOrder(null); lockRef.current = false
    document.body.style.overflow = 'hidden'

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

    return () => { document.body.style.overflow = '' }
  }, [isOpen, enrollment?.id])

  const startCheckout = () => {
    if (lockRef.current || !order || !window.Razorpay) return
    lockRef.current = true
    setPhase('paying')

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
      theme: { color: '#2563eb' },
      handler: async (res) => {
        try {
          await verifyPublicPayment(enrollment.id, {
            paymentId: order.paymentId,
            razorpayOrderId: res.razorpay_order_id,
            razorpayPaymentId: res.razorpay_payment_id,
            razorpaySignature: res.razorpay_signature,
          })
          setPhase('success')
        } catch (e) {
          setError(e.message || 'Verification failed — payment may still complete via webhook')
          setPhase('failed')
        } finally {
          lockRef.current = false
        }
      },
      modal: {
        ondismiss: () => {
          lockRef.current = false
          setPhase('ready')
        },
      },
    })
    rzp.on('payment.failed', (resp) => {
      lockRef.current = false
      setError(resp?.error?.description || 'Payment failed')
      setPhase('failed')
    })
    rzp.open()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={phase === 'paying' ? undefined : onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Complete your enrollment</h2>
          {phase !== 'paying' && (
            <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {phase === 'loading' && (
          <div className="py-8 text-center text-gray-500">Preparing payment…</div>
        )}

        {phase === 'ready' && order && (
          <>
            <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">Enrollment</div>
              <div className="font-mono text-sm text-gray-900">{order.enrollmentId}</div>
              <div className="mt-3 text-xs text-gray-500">Amount due</div>
              <div className="text-2xl font-bold text-gray-900">{inr(order.amount)}</div>
            </div>
            <button
              onClick={startCheckout}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition"
            >
              Pay {inr(order.amount)}
            </button>
            <p className="mt-4 text-center text-xs text-gray-400">
              Secured by Razorpay · Test mode
            </p>
          </>
        )}

        {phase === 'paying' && (
          <div className="py-8 text-center text-gray-500">
            Razorpay window open… complete your payment there.
          </div>
        )}

        {phase === 'success' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Payment received</h3>
            <p className="mt-2 text-sm text-gray-600">We'll be in touch shortly. Confirmation will reach you on email.</p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">Close</button>
          </div>
        )}

        {phase === 'failed' && (
          <div>
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              {error}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">Close</button>
              {order && (
                <button onClick={() => { setError(null); setPhase('ready') }} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Try again</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
