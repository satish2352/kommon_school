/**
 * Badge — status pill.
 *
 * Variants: success | warning | danger | neutral | info
 * Prop API unchanged: variant, children, className
 */
export function Badge({ variant = 'neutral', children, className = '' }) {
  /*
   * Reference (.status-badge):
   *   border-radius: 9999px; padding: 0.125rem 0.625rem;
   *   font-size: 0.75rem; line-height: 1rem; font-weight: 500;
   * Soft pastels with subtle 1px ring.
   */
  const variantCls = {
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70',
    warning: 'bg-amber-50  text-amber-700  ring-1 ring-amber-200/70',
    danger:  'bg-red-50    text-red-700    ring-1 ring-red-200/70',
    neutral: 'bg-slate-100 text-slate-600  ring-1 ring-slate-200/70',
    info:    'bg-brand-50  text-brand-700  ring-1 ring-brand-200/70',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium leading-4 ${variantCls[variant] ?? variantCls.neutral} ${className}`}
    >
      {children}
    </span>
  );
}
