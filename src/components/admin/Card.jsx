/**
 * Card — surface container with consistent radius, border, padding, shadow.
 *
 * Variants:
 *   default  — padded card (p-5)
 *   elevated — padded card with shadow
 *   flush    — no padding (for tables that touch the edges)
 */
export function Card({ children, variant = 'default', className = '' }) {
  const base = 'bg-white rounded-xl border border-slate-200';

  const variantCls = {
    default:  'p-5',
    elevated: 'p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)]',
    flush:    'overflow-hidden',
  };

  return (
    <div className={`${base} ${variantCls[variant] ?? variantCls.default} ${className}`}>
      {children}
    </div>
  );
}
