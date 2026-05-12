/**
 * StatusToggle — clickable status pill that toggles between ACTIVE / INACTIVE.
 *
 * When isLocked is true, renders a non-interactive badge with a lock icon.
 *
 * Prop API unchanged: status, onToggle, disabled, isLocked
 */
export function StatusToggle({ status, onToggle, disabled = false, isLocked = false }) {
  if (isLocked) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium leading-4 ${
          status === 'ACTIVE'
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70'
            : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200/70'
        }`}
        title="System default — status cannot be changed"
      >
        <svg
          className="w-3 h-3 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        {status}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      title="Click to toggle status"
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium leading-4 cursor-pointer
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed ${
        status === 'ACTIVE'
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70 hover:bg-emerald-100 hover:ring-emerald-300'
          : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200/70 hover:bg-slate-200 hover:ring-slate-300'
      }`}
    >
      {/* Status dot */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {status}
    </button>
  );
}
