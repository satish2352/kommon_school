/**
 * Button — admin action button.
 *
 * Variants: primary | secondary | ghost | danger | success
 * Sizes:    sm | md | lg
 * Loading:  shows inline spinner, disables interaction
 *
 * Prop API is backward-compatible: variant, size, loading, disabled, type, className, children, ...rest
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
  /*
   * Reference: solid primary `bg-primary text-primary-foreground hover:opacity-90`.
   * No aggressive lift, no gradient — calm shadcn-style buttons with radius `--radius` (10px).
   */
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-[0.625rem] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap';

  const variantCls = {
    primary: [
      'bg-brand-500 text-white shadow-sm',
      'hover:bg-brand-600 hover:shadow-md',
      'active:bg-brand-700',
      'focus:ring-brand-400',
    ].join(' '),

    secondary: [
      'border bg-white text-slate-700 shadow-sm',
      'hover:bg-slate-50 hover:text-slate-900',
      'focus:ring-brand-300',
    ].join(' '),

    ghost: [
      'text-slate-600 bg-transparent',
      'hover:bg-slate-100 hover:text-slate-900',
      'focus:ring-slate-300',
    ].join(' '),

    danger: [
      'bg-red-600 text-white shadow-sm',
      'hover:bg-red-700 hover:shadow-md',
      'focus:ring-red-400',
    ].join(' '),

    success: [
      'bg-emerald-600 text-white shadow-sm',
      'hover:bg-emerald-700 hover:shadow-md',
      'focus:ring-emerald-400',
    ].join(' '),
  };

  const sizeCls = {
    sm: 'px-3 py-1.5 text-xs h-8',
    md: 'px-4 py-2 text-[13px] h-9',
    lg: 'px-6 py-2.5 text-sm h-10',
  };

  const inlineBorder = variant === 'secondary' ? { borderColor: 'var(--admin-border, #E5E7EB)' } : undefined;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variantCls[variant] ?? variantCls.primary} ${sizeCls[size] ?? sizeCls.md} ${className}`}
      style={inlineBorder}
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
