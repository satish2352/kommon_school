/**
 * Button — admin action button.
 *
 * Variants: primary | secondary | ghost | danger
 * Sizes:    sm | md
 * Loading:  shows inline spinner, disables interaction
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantCls = {
    primary:   'bg-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger:    'bg-red-600 text-white hover:bg-red-700',
  };

  const sizeCls = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variantCls[variant] ?? variantCls.primary} ${sizeCls[size] ?? sizeCls.md} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="w-3.5 h-3.5 animate-spin shrink-0"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeOpacity="0.3"
            strokeWidth="4"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
