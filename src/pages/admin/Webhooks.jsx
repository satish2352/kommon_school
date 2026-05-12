// DEV: console.debug('[admin-webhooks]', ...) calls below — remove after verification.

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { webhookAdminService } from '../../services/webhookAdminService';
import { PageHeader, Card, StatCard, Button, Skeleton, Pagination } from '../../components/admin';

// ---------------------------------------------------------------------------
// Dummy samples — used by the "Send test webhook" button so the admin can
// verify webhook delivery without going through the full enrollment flow.
// The sample is now sent server-side via POST /api/v1/webhooks/test.
// ---------------------------------------------------------------------------
const TEST_SAMPLES = [
  {
    enrollment: {
      id: 'test_enr_001',
      enrollmentId: 'KOM-TEST-001',
      name: 'Ravi Sharma',
      email: 'ravi.sharma@example.com',
      phone: '9876543210',
    },
    order: { amount: 49900, currency: 'INR' },
    rzpResponse: { razorpay_payment_id: 'pay_TEST_RAVI_001' },
    planSelection: {
      id: 1,
      tier: 'SILVER',
      name: 'Silver',
      promoCode: 'NEW501',
      durationMonths: 1,
      basePrice: 499.00,
      discountPercent: 0,
      finalPrice: 499.00,
      discountLabel: null,
    },
  },
  {
    enrollment: {
      id: 'test_enr_002',
      enrollmentId: 'KOM-TEST-002',
      name: 'Priya Kapoor',
      email: 'priya.kapoor@example.com',
      phone: '9123456780',
    },
    order: { amount: 539460, currency: 'INR' },
    rzpResponse: { razorpay_payment_id: 'pay_TEST_PRIYA_002' },
    planSelection: {
      id: 2,
      tier: 'GOLD',
      name: 'Gold',
      promoCode: 'NEW501',
      durationMonths: 6,
      basePrice: 5994.00,
      discountPercent: 10,
      finalPrice: 5394.60,
      discountLabel: 'Save 10%',
    },
  },
  {
    enrollment: {
      id: 'test_enr_003',
      enrollmentId: 'KOM-TEST-003',
      name: 'Arjun Desai',
      email: 'arjun.desai@example.com',
      phone: '9988776655',
    },
    order: { amount: 2038980, currency: 'INR' },
    // No rzpResponse — forces fallback transactionId generation
    rzpResponse: null,
    planSelection: {
      id: 3,
      tier: 'PLATINUM',
      name: 'Platinum',
      promoCode: 'NEW501',
      durationMonths: 12,
      basePrice: 23988.00,
      discountPercent: 15,
      finalPrice: 20389.80,
      discountLabel: 'Save 15%',
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN');
  } catch {
    return iso;
  }
}

function prettyJSON(value) {
  if (value == null) return null;
  if (typeof value === 'object') {
    try { return JSON.stringify(value, null, 2); } catch { return String(value); }
  }
  // Try to parse as JSON string
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(value);
  }
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ ok, responseStatus }) {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {responseStatus ?? '2xx'}
      </span>
    );
  }
  if (responseStatus == null) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Network error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      {responseStatus}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Individual history card (collapsible)
// Adapts to the new WebhookDelivery schema from the backend.
// Fields: id, enrollmentId, destinationUrl, method, requestPayload (object),
//         requestHeaders (object), responseStatus, responseBody, errorMessage,
//         durationMs, ok, promoCode, courseMatched, source, sentAt
// ---------------------------------------------------------------------------
function HistoryCard({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const payloadStr  = prettyJSON(entry.requestPayload);
  const bodyStr     = entry.responseBody ? prettyJSON(entry.responseBody) : null;
  const headersStr  = entry.requestHeaders ? prettyJSON(entry.requestHeaders) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors duration-150">
      {/* Collapsed row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors duration-150"
      >
        {/* Status badge */}
        <div className="shrink-0">
          <StatusBadge ok={entry.ok} responseStatus={entry.responseStatus} />
        </div>

        {/* Source pill — Backend vs Test */}
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${
            entry.source === 'ADMIN_TEST'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          {entry.source === 'ADMIN_TEST' ? 'Test' : 'Backend'}
        </span>

        {/* Enrollment ID + metadata */}
        <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-xs text-slate-500 truncate">
            {entry.enrollmentId ?? '—'}
          </span>
          <span className="text-xs text-slate-400">{formatDate(entry.sentAt)}</span>
          <span className="text-xs text-slate-400">
            {entry.durationMs != null ? `${entry.durationMs} ms` : ''}
          </span>
          {/* Promo code + course match indicator */}
          {entry.promoCode && (
            <span className="text-xs text-slate-400">
              Promo: {entry.promoCode} · {entry.courseMatched ? 'Course matched' : 'No course match'}
            </span>
          )}
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-4 bg-slate-50/40">
          {/* Error banner — shown when fetch threw (network error) */}
          {entry.errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {entry.errorMessage}
            </div>
          )}

          {/* Request info */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Request</div>
            <div className="text-sm text-slate-700 font-mono break-all">
              <span className="text-emerald-600 font-semibold">{entry.method}</span>{' '}
              {entry.destinationUrl}
            </div>
            {headersStr && (
              <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto text-xs font-mono text-slate-800 leading-relaxed">
                {headersStr}
              </pre>
            )}
          </div>

          {/* Payload */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payload</div>
            <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto text-xs font-mono text-slate-800 leading-relaxed">
              {payloadStr}
            </pre>
          </div>

          {/* Response */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Response</div>
            <div className="text-xs text-slate-600">
              Status:{' '}
              <span className="font-medium text-slate-800">
                {entry.responseStatus != null ? entry.responseStatus : 'N/A'}
              </span>
            </div>
            {bodyStr && (
              <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto text-xs font-mono text-slate-800 leading-relaxed">
                {bodyStr}
              </pre>
            )}
            {!bodyStr && !entry.errorMessage && (
              <div className="text-xs text-slate-400 italic">No response body captured.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Webhooks() {
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats]           = useState({
    total: 0,
    successful: 0,
    failed: 0,
    networkError: 0,
    last24h: 0,
    last7d: 0,
  });
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [sending, setSending]           = useState(false);
  const [page, setPage]                 = useState(1);
  const [limit, setLimit]               = useState(20);
  const [meta, setMeta]                 = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [autoRefresh, setAutoRefresh]   = useState(false);

  // ── Load data from backend ────────────────────────────────────────────────
  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      if (import.meta.env.DEV) {
        console.debug('[admin-webhooks] fetch start', { page, limit, statusFilter });
      }
      const [result, statsResult] = await Promise.all([
        webhookAdminService.listDeliveries({
          page,
          limit,
          status: statusFilter || undefined,
        }),
        webhookAdminService.getStats(),
      ]);
      setDeliveries(result.deliveries);
      setMeta(result.meta);
      setStats(statsResult);
      if (import.meta.env.DEV) {
        console.debug('[admin-webhooks] fetch result', {
          count: result.deliveries.length,
          total: result.meta.total,
        });
      }
    } catch (err) {
      const msg = err.message ?? 'Failed to load webhook deliveries';
      setError(msg);
      toast.error(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, limit, statusFilter]);

  // Mount + re-fetch when page/limit/filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Auto-refresh ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData({ silent: true });
        if (import.meta.env.DEV) {
          console.debug('[admin-webhooks] auto-refresh tick');
        }
      }
    }, 10_000);
    return () => clearInterval(id);
  }, [autoRefresh, loadData]);

  // ── Test webhook ──────────────────────────────────────────────────────────
  const handleSendTest = async () => {
    if (sending) return;
    setSending(true);
    const sample = TEST_SAMPLES[Math.floor(Math.random() * TEST_SAMPLES.length)];
    try {
      await webhookAdminService.sendTestWebhook(sample);
      if (import.meta.env.DEV) {
        console.debug('[admin-webhooks] test webhook sent successfully');
      }
      toast.success('Test webhook sent');
      // Reset to page 1 so the new entry appears at top
      setPage(1);
    } catch (err) {
      toast.error(err.message ?? 'Failed to send test webhook');
    } finally {
      setSending(false);
      // Reload — if page was already 1, loadData runs via the effect above;
      // call explicitly to guarantee immediate refresh
      await loadData();
    }
  };

  // ── Filter / page handlers ────────────────────────────────────────────────
  const handleFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setPage(1);
    if (import.meta.env.DEV) {
      console.debug('[admin-webhooks] filter changed', { newStatus });
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    if (import.meta.env.DEV) {
      console.debug('[admin-webhooks] page changed', { newPage });
    }
  };

  const handleManualRefresh = () => {
    loadData();
    if (import.meta.env.DEV) {
      console.debug('[admin-webhooks] manual refresh');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="Webhooks"
        subtitle="Outgoing webhook deliveries — backend-fired and admin test sends"
        action={
          <>
            {/* Auto-refresh toggle */}
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-300"
              />
              Auto-refresh
            </label>
            <Button
              variant="primary"
              loading={sending}
              onClick={handleSendTest}
              disabled={sending}
            >
              {!sending && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h14" />
                </svg>
              )}
              {sending ? 'Sending…' : 'Send test webhook'}
            </Button>
            <Button variant="secondary" onClick={handleManualRefresh}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.5 19A9 9 0 1019.5 9.5" />
              </svg>
              Refresh
            </Button>
          </>
        }
      />

      {/* ── Stat strip — sourced from getStats(), not client-side counts ──── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total deliveries"
          value={stats.total}
          accentClass="from-emerald-500 to-emerald-600"
        />
        <StatCard
          label="Successful (2xx)"
          value={stats.successful}
          accentClass="from-emerald-500 to-emerald-600"
        />
        <StatCard
          label="Failed / Errors"
          value={stats.failed + stats.networkError}
          accentClass={(stats.failed + stats.networkError) > 0
            ? 'from-red-500 to-red-600'
            : 'from-slate-500 to-slate-600'}
        />
        <StatCard
          label="Last 24 h"
          value={stats.last24h}
          accentClass="from-slate-400 to-slate-500"
        />
      </div>

      {/* ── Status filter pills ───────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {[
          ['', 'All'],
          ['success', 'Successful'],
          ['failed', 'Failed'],
          ['error', 'Network Error'],
        ].map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => handleFilterChange(val)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 ${
              statusFilter === val
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <span className="text-sm text-red-700">{error}</span>
          <Button variant="secondary" onClick={handleManualRefresh}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex gap-3 items-center">
                <Skeleton w="w-16" h="h-5" />
                <Skeleton w="w-12" h="h-5" />
                <Skeleton w="w-32" h="h-4" />
                <Skeleton w="w-24" h="h-4" />
                <Skeleton w="w-16" h="h-4" />
              </div>
            </div>
          ))}
        </div>
      ) : deliveries.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <svg
              className="w-10 h-10 text-slate-300 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
            <p className="text-slate-400 text-sm">No webhooks delivered yet.</p>
            <p className="text-slate-400 text-xs mt-1">Use the button above to send a test webhook.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-2 pb-2">
            {deliveries.map((entry) => (
              <HistoryCard key={entry.id} entry={entry} />
            ))}
          </div>
          {/* Pagination */}
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={handlePageChange}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}
