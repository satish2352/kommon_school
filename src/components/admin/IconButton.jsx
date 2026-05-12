/**
 * IconButton — square icon button for table action columns.
 *
 * Variants: default (brand hover) | danger (red hover)
 * Prop API unchanged: icon, variant, disabled, title, onClick, className, type
 */
export function IconButton({
  icon,
  variant = 'default',
  disabled = false,
  title,
  onClick,
  className = '',
  type = 'button',
}) {
  const base =
    'p-1.5 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-1';

  const variantCls = disabled
    ? 'text-slate-300 opacity-40 cursor-not-allowed pointer-events-none'
    : variant === 'danger'
      ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
      : 'text-slate-500 hover:text-brand-700 hover:bg-slate-100';

  return (
    <button
      type={type}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`${base} ${variantCls} ${className}`}
    >
      {icon}
    </button>
  );
}
