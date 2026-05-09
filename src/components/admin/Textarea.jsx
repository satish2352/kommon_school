/**
 * Textarea — labeled textarea with built-in error and hint slots.
 */
export function Textarea({ label, error, hint, required, id, className = '', ...props }) {
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
      <textarea
        id={inputId}
        className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition-colors duration-200 resize-none ${
          error
            ? 'border-red-300 focus:ring-red-300'
            : 'border-slate-300 focus:ring-emerald-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {hint && !error && <p className="text-slate-400 text-xs mt-1">{hint}</p>}
    </div>
  );
}
