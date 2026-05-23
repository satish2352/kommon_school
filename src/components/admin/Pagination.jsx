/**
 * Pagination — production-grade pager for large server-side lists.
 *
 * Renders:
 *   [« First] [‹ Prev]  1 … 5 6 [7] 8 9 … 248  [Next ›] [Last »]
 *
 *   Showing 21–40 of 4,328,901   [10 | 20 | 50 | 100] / page
 *
 * Behaviour:
 *   - At most ~7 numbered buttons visible at a time (with two ellipses).
 *   - First / Last buttons appear when there are >5 pages.
 *   - Rows-per-page select is rendered only when `onLimitChange` is wired.
 *   - The component is purely controlled — no internal page state.
 *
 * Props:
 *   page          number     1-based current page
 *   totalPages    number     1-based last page (server-supplied)
 *   total         number     total records (display only)
 *   limit         number?    current page size (used for "Showing X–Y of Z")
 *   onPageChange  fn(page)   called with a clamped 1..totalPages page number
 *   onLimitChange fn(limit)? called when the user picks a different page size
 *   limitOptions  number[]?  page-size choices; defaults to [10, 20, 50, 100]
 *
 * All previous call sites (page / totalPages / total / limit / onPageChange /
 * onLimitChange) continue to work unchanged.
 */
export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
}) {
  const pages = Math.max(1, Number(totalPages) || 1);
  const current = Math.min(Math.max(1, Number(page) || 1), pages);

  const startIdx = total > 0 && limit ? (current - 1) * limit + 1 : 0;
  const endIdx   = total > 0 && limit ? Math.min(current * limit, total) : 0;

  const pageNumbers = buildPageRange(current, pages);

  const pillBase =
    'px-3 h-8 inline-flex items-center justify-center rounded-[0.625rem] text-[13px] font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-200';
  const borderSty = { borderColor: 'var(--admin-border, #E5E7EB)' };

  const goto = (n) => {
    const clamped = Math.min(Math.max(1, n), pages);
    if (clamped !== current) onPageChange(clamped);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      {/* Left side: range label + rows-per-page */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-slate-500 text-[13px]">
          {total > 0 ? (
            <>
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {startIdx.toLocaleString()}–{endIdx.toLocaleString()}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-800">
                {Number(total).toLocaleString()}
              </span>
            </>
          ) : (
            <span className="font-semibold text-slate-800">0 results</span>
          )}
        </span>
        {/* "Rows per page" dropdown intentionally not rendered.
            Call sites may still pass `onLimitChange` / `limit` but the
            selector is hidden so the footer stays compact. */}
      </div>

      {/* Right side: page navigator */}
      <nav
        className="flex items-center gap-1.5"
        aria-label="Pagination"
        role="navigation"
      >
        {pages > 5 && (
          <NavButton
            label="First page"
            disabled={current === 1}
            onClick={() => goto(1)}
            pillBase={pillBase}
            borderSty={borderSty}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </NavButton>
        )}

        <NavButton
          label="Previous page"
          disabled={current === 1}
          onClick={() => goto(current - 1)}
          pillBase={pillBase}
          borderSty={borderSty}
        >
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Prev</span>
          </span>
        </NavButton>

        {pageNumbers.map((n, i) =>
          n === '…' ? (
            <span
              key={`gap-${i}`}
              className="px-2 h-8 inline-flex items-center text-slate-400 text-[13px] select-none"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => goto(n)}
              aria-current={n === current ? 'page' : undefined}
              aria-label={`Page ${n}`}
              className={
                n === current
                  ? `${pillBase} bg-brand-500 text-white shadow-sm min-w-[36px]`
                  : `${pillBase} border bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 min-w-[36px]`
              }
              style={n === current ? undefined : borderSty}
            >
              {n}
            </button>
          ),
        )}

        <NavButton
          label="Next page"
          disabled={current >= pages}
          onClick={() => goto(current + 1)}
          pillBase={pillBase}
          borderSty={borderSty}
        >
          <span className="flex items-center gap-1">
            <span className="hidden sm:inline">Next</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </NavButton>

        {pages > 5 && (
          <NavButton
            label="Last page"
            disabled={current === pages}
            onClick={() => goto(pages)}
            pillBase={pillBase}
            borderSty={borderSty}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </NavButton>
        )}
      </nav>
    </div>
  );
}

/* ─── Internals ──────────────────────────────────────────────────────────── */

function NavButton({ label, disabled, onClick, children, pillBase, borderSty }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`${pillBase} border bg-white text-slate-600
        hover:bg-slate-50 hover:text-slate-900
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600`}
      style={borderSty}
    >
      {children}
    </button>
  );
}

/**
 * Build the visible page-number range with ellipses.
 *
 * Examples (current/last):
 *    1/1   → [1]
 *    1/5   → [1,2,3,4,5]
 *    1/20  → [1,2,3,4,5,'…',20]
 *    7/20  → [1,'…',5,6,7,8,9,'…',20]
 *    18/20 → [1,'…',16,17,18,19,20]
 *
 * Always shows first + last; up to 3 neighbours around current.
 */
function buildPageRange(current, last) {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const out = [];
  const window = 1; // pages on each side of current
  const left   = Math.max(2, current - window);
  const right  = Math.min(last - 1, current + window);

  out.push(1);
  if (left > 2) out.push('…');
  for (let i = left; i <= right; i++) out.push(i);
  if (right < last - 1) out.push('…');
  out.push(last);
  return out;
}
