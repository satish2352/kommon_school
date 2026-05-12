/**
 * Card — surface container with consistent radius, border, padding, shadow.
 *
 * Variants:
 *   default  — padded white card with glass finish
 *   elevated — heavier shadow for prominent sections
 *   flush    — no padding (for tables that touch the edges)
 *
 * Optional props:
 *   title    — renders a gradient-strip header above the body
 *
 * Prop API is backward-compatible: variant, className, children, title
 */
export function Card({ children, variant = 'default', className = '', title }) {
  /*
   * Reference (.erp-card):
   *   border-radius: 0.75rem; border: 1px solid hsl(214 20% 90%);
   *   box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
   *   hover: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
   */
  const base = 'bg-white rounded-xl border transition-shadow duration-200';
  const borderStyle = { borderColor: 'var(--admin-border)' };

  const variantCls = {
    default:  'p-5 shadow-card hover:shadow-card-hover',
    elevated: 'p-5 shadow-card-hover',
    flush:    'overflow-hidden shadow-card hover:shadow-card-hover',
  };

  if (title) {
    return (
      <div
        className={`${base} ${variantCls[variant] ?? variantCls.default} overflow-hidden ${className}`}
        style={borderStyle}
      >
        <div
          className="px-5 py-3 border-b"
          style={{ background: '#F8F9FA', borderColor: 'var(--admin-border)' }}
        >
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
        </div>
        <div className={variant === 'flush' ? '' : 'p-5'}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`${base} ${variantCls[variant] ?? variantCls.default} ${className}`} style={borderStyle}>
      {children}
    </div>
  );
}
