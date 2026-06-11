import { useState } from 'react';

/**
 * Input — labeled text input with built-in error, hint, and password-reveal.
 *
 * Supports controlled and uncontrolled usage. All standard input props
 * are forwarded via spread.
 *
 * Password show/hide:
 *   When `type === 'password'` the input renders a small eye / eye-off
 *   button inside the field that toggles the type to 'text'. Disable the
 *   toggle on a per-field basis by passing `noToggle` (e.g. for hidden
 *   honeypot fields or future masked-but-non-secret use cases).
 *
 * Prop API:
 *   label, error, hint, required, id, className, type, noToggle, ...rest
 */
export function Input({
  label,
  error,
  hint,
  required,
  id,
  className = '',
  type = 'text',
  noToggle = false,
  showCount = false,
  maxLength,
  value,
  ...props
}) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Live character counter (current / max). Shown alongside the error/hint
  // so the limit stays visible even while a validation message is displayed.
  const len = String(value ?? '').length;
  const counter = showCount && maxLength != null ? `${len}/${maxLength}` : null;
  const atLimit = showCount && maxLength != null && len >= maxLength;

  // Password reveal — local state, no prop needed at the call site. The
  // input's actual `type` switches from 'password' to 'text' while the
  // user clicks the eye button; switching back to 'password' restores
  // browser masking.
  const isPassword = type === 'password' && !noToggle;
  const [revealed, setRevealed] = useState(false);
  const effectiveType = isPassword && revealed ? 'text' : type;

  // Extra right padding when the toggle button is shown so the value text
  // doesn't overlap the icon.
  const paddingClass = isPassword ? 'pr-10' : 'pr-3';

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
        <input
          id={inputId}
          type={effectiveType}
          value={value}
          maxLength={maxLength}
          className={`w-full pl-3 ${paddingClass} h-9 rounded-[0.625rem] border text-[13px] text-slate-800 bg-white placeholder-slate-400
            focus:outline-none focus:ring-2 transition-all duration-150
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${error
              ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/30'
              : 'focus:ring-brand-200 focus:border-brand-500'
            } ${className}`}
          style={!error ? { borderColor: 'var(--admin-border, #E5E7EB)' } : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            // tabIndex -1 so Tab order is Email -> Password -> Confirm
            // (skipping the toggle). Mouse users still reach it.
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            title={revealed ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            {revealed ? (
              // eye-off
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.585 10.585a2 2 0 102.83 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.638 0 8.573 3.007 9.964 7.178a1.012 1.012 0 010 .644 11.59 11.59 0 01-2.043 3.408M6.221 6.221C4.215 7.51 2.65 9.45 2.036 11.822a1.012 1.012 0 000 .644C3.423 16.49 7.36 19.5 12 19.5c1.886 0 3.66-.49 5.197-1.353" />
              </svg>
            ) : (
              // eye
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.964 7.178.07.207.07.431 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}
      </div>
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
