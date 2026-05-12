/**
 * Pagination — Prev / page display / Next with optional rows-per-page select.
 *
 * Props (unchanged):
 *   page          number
 *   totalPages    number
 *   total         number — total record count (for display)
 *   limit         number (optional) — current page size
 *   onPageChange  function(newPage: number)
 *   onLimitChange function(newLimit: number) (optional)
 */
export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}) {
  const pages = totalPages || 1;

  const pillBase =
    'px-3 h-8 inline-flex items-center rounded-[0.625rem] text-[13px] font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-200';

  const borderSty = { borderColor: 'var(--admin-border, #E5E7EB)' };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      <div className="flex items-center gap-3">
        <span className="text-slate-500 text-[13px]">
          <span className="font-semibold text-slate-800">{total}</span> total
        </span>
        {onLimitChange && limit != null && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2.5 h-8 rounded-[0.625rem] border text-[12px] bg-white text-slate-700
              focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500
              transition-all duration-150"
            style={borderSty}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className={`${pillBase} border bg-white text-slate-600
            hover:bg-slate-50 hover:text-slate-900
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600`}
          style={borderSty}
        >
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </span>
        </button>

        <span className="px-3 h-8 inline-flex items-center rounded-[0.625rem] bg-brand-500 text-white text-[13px] font-semibold min-w-[70px] justify-center">
          {page} / {pages}
        </span>

        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className={`${pillBase} border bg-white text-slate-600
            hover:bg-slate-50 hover:text-slate-900
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600`}
          style={borderSty}
        >
          <span className="flex items-center gap-1">
            Next
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
