/**
 * Select — labeled select with built-in error and hint slots.
 * Children should be <option> elements.
 */
export function Select({ label, error, hint, required, id, className = '', children, ...props }) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 transition-colors duration-200 ${
          error
            ? 'border-red-300 focus:ring-red-300'
            : 'border-slate-300 focus:ring-emerald-300'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {hint && !error && <p className="text-slate-400 text-xs mt-1">{hint}</p>}
    </div>
  );
}
