/**
 * IconButton — square icon button for table action columns.
 *
 * Variants: default (indigo hover) | danger (red hover)
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
    'p-1.5 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-1';

  const variantCls = disabled
    ? 'text-slate-300 opacity-40 cursor-not-allowed pointer-events-none'
    : variant === 'danger'
      ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50';

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
