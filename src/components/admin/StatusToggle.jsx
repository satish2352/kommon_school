/**
 * StatusToggle — clickable status pill that toggles between ACTIVE / INACTIVE.
 *
 * When isLocked is true, renders a non-interactive badge with a lock icon
 * (system-default rows).
 */
export function StatusToggle({ status, onToggle, disabled = false, isLocked = false }) {
  if (isLocked) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          status === 'ACTIVE'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-slate-100 text-slate-600'
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
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
        status === 'ACTIVE'
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {status}
    </button>
  );
}
