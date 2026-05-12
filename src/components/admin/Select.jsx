/**
 * Select — labeled select with built-in error and hint slots.
 * Children should be <option> elements.
 *
 * Prop API unchanged: label, error, hint, required, id, className, children, ...rest
 */
export function Select({ label, error, hint, required, id, className = '', children, ...props }) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[13px] font-medium text-slate-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          className={`w-full pl-3 pr-9 h-9 rounded-[0.625rem] border text-[13px] text-slate-800 bg-white appearance-none
            focus:outline-none focus:ring-2 transition-all duration-150
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${error
              ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/30'
              : 'focus:ring-brand-200 focus:border-brand-500'
            } ${className}`}
          style={!error ? { borderColor: 'var(--admin-border, #E5E7EB)' } : undefined}
          {...props}
        >
          {children}
        </select>
        {/* Custom chevron */}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && <p className="text-slate-400 text-xs mt-1.5">{hint}</p>}
    </div>
  );
}
