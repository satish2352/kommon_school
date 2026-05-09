/**
 * Badge — status pill.
 *
 * Variants: success | warning | danger | neutral | info
 */
export function Badge({ variant = 'neutral', children, className = '' }) {
  const variantCls = {
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger:  'bg-red-50 text-red-700',
    neutral: 'bg-slate-100 text-slate-600',
    info:    'bg-indigo-50 text-indigo-700',
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${variantCls[variant] ?? variantCls.neutral} ${className}`}
    >
      {children}
    </span>
  );
}
