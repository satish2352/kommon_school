/**
 * Pagination — Prev / page display / Next with optional rows-per-page select.
 *
 * Props:
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

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      <div className="flex items-center gap-3">
        <span>{total} total</span>
        {onLimitChange && limit != null && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 rounded border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors duration-200"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          Prev
        </button>
        <span className="px-3 py-1.5 text-slate-600">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}
