import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { employeeLeadService } from '../../services/employeeLeadService';
import {
  PageHeader,
  Card,
  Badge,
  Input,
  Select,
  Th,
  Td,
  Tr,
  Table,
  Skeleton,
  EmptyState,
} from '../../components/admin';

/* ─── Constants ─────────────────────────────────────────────────────────── */

// Employee-facing followup status labels. The DB enum has more values
// (legacy + admin-only) — we expose only the buckets an employee actually
// uses day-to-day.
// Simplified status set per product decision. Dashboard tiles deep-link
// here with these query values; the lead-detail Status dropdown uses
// the same set when an employee updates a lead.
//   new                → no follow-up taken yet (untouched)
//   contacted          → follow-up in progress (employee has spoken to lead)
//   interested         → showing interest
//   not_interested     → declined
//   closed             → wrapped up (any final state)
const FOLLOWUP_STATUS_FILTERS = [
  { value: '',                   label: 'All'                    },
  { value: 'new',                label: 'New'                    },
  { value: 'contacted',          label: 'Follow-up In Progress'  },
  { value: 'interested',         label: 'Interested'             },
  { value: 'not_interested',     label: 'Not Interested'         },
  { value: 'closed',             label: 'Closed'                 },
];

const STATUS_BADGE_VARIANT = {
  new:                'info',
  contacted:          'warning',
  interested:         'success',
  not_interested:     'neutral',
  converted:          'success',
  closed:             'neutral',
};

// Normalise the raw followup status (which may be a legacy enum value
// like 'payment_pending' for older rows) into one of the 5 simplified
// labels the UI surfaces. Anything that isn't a real outcome the
// employee has recorded falls back to 'new'.
const REAL_OUTCOMES = ['contacted', 'interested', 'not_interested', 'converted', 'closed'];
function displayStatus(raw) {
  if (raw && REAL_OUTCOMES.includes(raw)) return raw;
  return 'new';
}

// Human-readable label for a normalised status. Uses the simplified
// vocabulary the user signed off on (Follow-up In Progress, etc.).
const STATUS_LABEL = {
  new:            'New',
  contacted:      'Follow-up In Progress',
  interested:     'Interested',
  not_interested: 'Not Interested',
  converted:      'Converted',
  closed:         'Closed',
};

const DEFAULT_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 350;

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatDateTime(value) {
  if (!value) return '—';
  try { return new Date(value).toLocaleString(); } catch { return '—'; }
}

// Bucket the next-follow-up timestamp into a quick visual flag —
// helps an employee scan their queue for what's overdue today.
function dueClass(nextDate) {
  if (!nextDate) return 'text-slate-400';
  const now = Date.now();
  const t   = new Date(nextDate).getTime();
  if (Number.isNaN(t))         return 'text-slate-400';
  if (t < now)                 return 'text-red-600 font-semibold';     // overdue
  if (t - now < 24 * 3600_000) return 'text-amber-600 font-semibold';   // due today
  return 'text-slate-600';
}

/* ─── Skeleton rows ─────────────────────────────────────────────────────── */

const COLS = ['Lead', 'Email', 'Phone', 'Follow-up status', 'Next follow-up', 'Created'];

function SkeletonRows({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Tr key={i} striped={i % 2 === 1}>
          {COLS.map((_h, j) => (
            <Td key={j}><Skeleton w="w-24" /></Td>
          ))}
        </Tr>
      ))}
    </>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function EmployeeLeads() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // URL-persisted state so refreshing the page keeps the filter set.
  const [search, setSearch]                 = useState(searchParams.get('q') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [followupStatus, setFollowupStatus] = useState(searchParams.get('followupStatus') ?? '');
  const [page, setPage]                     = useState(Number(searchParams.get('page')) || 1);

  // Debounce search input to keep the server quiet between keystrokes.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  // Sync URL with state so the page is bookmarkable.
  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch)               next.set('q', debouncedSearch);
    if (followupStatus)                next.set('followupStatus', followupStatus);
    if (page > 1)                      next.set('page', String(page));
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, followupStatus, page, setSearchParams]);

  const filters = useMemo(() => ({
    page,
    limit: DEFAULT_LIMIT,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    ...(followupStatus           ? { followupStatus }                  : {}),
  }), [page, debouncedSearch, followupStatus]);

  const [data, setData]     = useState(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoad(true);
    setError(null);
    employeeLeadService.list(filters)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e)  => { if (!cancelled) setError(e); })
      .finally(()  => { if (!cancelled) setLoad(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const items      = Array.isArray(data?.items) ? data.items : [];
  const total      = Number(data?.total ?? 0);
  const totalPages = Math.max(1, Number(data?.totalPages ?? 1));

  // Clamp page if the server reports fewer pages than we currently sit on
  // (can happen after a filter narrows results).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const filtersActive = Boolean(search || followupStatus);
  const resetFilters = () => {
    setSearch('');
    setFollowupStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Leads"
        subtitle="Leads assigned to you. Click a row to open the lead and add notes or update status."
        action={<span className="text-sm text-slate-500">{total} total</span>}
      />

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <Input
              label="Search"
              type="search"
              placeholder="Name, email, or phone (3+ chars)"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-56">
            <Select
              label="Follow-up status"
              value={followupStatus}
              onChange={(e) => { setFollowupStatus(e.target.value); setPage(1); }}
            >
              {FOLLOWUP_STATUS_FILTERS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </Card>

      {/* ── Error state ────────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error.message || 'Failed to load leads.'}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <Card variant="flush">
        <Table>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {COLS.map((h) => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <SkeletonRows />}

            {!loading && !error && items.length === 0 && (
              <EmptyState
                colSpan={COLS.length}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                title={filtersActive ? 'No leads match the current filters' : 'No leads assigned to you yet'}
                description={filtersActive
                  ? 'Try clearing the filters or widening the search.'
                  : 'When an admin assigns a lead to you, it will appear here.'}
              />
            )}

            {!loading && !error && items.map((lead, idx) => {
              const fu = lead.followup;
              // Normalise the raw status so stale legacy values
              // (payment_pending etc.) render as the simplified
              // labels the rest of the module uses.
              const status = displayStatus(fu?.status);
              return (
                <Tr
                  key={lead.id}
                  striped={idx % 2 === 1}
                  // Full-row click opens the detail page (where notes +
                  // status + next-follow-up are all recorded). Cursor and
                  // hover hint communicate the affordance.
                  onClick={() => navigate(`/employee/leads/${lead.id}`)}
                  className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                >
                  <Td>
                    <div className="text-slate-900 font-medium">
                      {lead.fullName || '(no name)'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {lead.enrollmentCode}
                    </div>
                  </Td>
                  <Td className="text-slate-600">{lead.email || '—'}</Td>
                  <Td className="text-slate-600">{lead.phone || '—'}</Td>
                  <Td>
                    <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'neutral'}>
                      {STATUS_LABEL[status] ?? status.replace(/_/g, ' ')}
                    </Badge>
                  </Td>
                  <Td className={`text-xs ${dueClass(fu?.next_followup_date)}`}>
                    {formatDateTime(fu?.next_followup_date)}
                  </Td>
                  <Td className="text-slate-500 text-xs">
                    {formatDateTime(lead.createdAt)}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 pb-2">
        <div>{total} total</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Prev
          </button>
          <span className="px-3 py-1.5 text-slate-600">Page {page} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
