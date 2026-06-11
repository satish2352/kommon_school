/**
 * Textarea — labeled textarea with built-in error and hint slots.
 *
 * Prop API unchanged: label, error, hint, required, id, className, ...rest
 */
export function Textarea({ label, error, hint, required, id, className = '', showCount = false, maxLength, value, ...props }) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Live character counter (current / max), shown alongside any error/hint.
  const len = String(value ?? '').length;
  const counter = showCount && maxLength != null ? `${len}/${maxLength}` : null;
  const atLimit = showCount && maxLength != null && len >= maxLength;

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
      <textarea
        id={inputId}
        value={value}
        maxLength={maxLength}
        className={`w-full px-3 py-2.5 rounded-[0.625rem] border text-[13px] text-slate-800 bg-white placeholder-slate-400
          focus:outline-none focus:ring-2 transition-all duration-150 resize-none
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${error
            ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/30'
            : 'focus:ring-brand-200 focus:border-brand-500'
          } ${className}`}
        style={!error ? { borderColor: 'var(--admin-border, #E5E7EB)' } : undefined}
        {...props}
      />
      {(error || hint || counter) && (
        <div className="mt-1.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            {error ? (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            ) : hint ? (
              <p className="text-slate-400 text-xs">{hint}</p>
            ) : null}
          </div>
          {counter && (
            <span className={`text-xs shrink-0 tabular-nums ${atLimit ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
              {counter}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
