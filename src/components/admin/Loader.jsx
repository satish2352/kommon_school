/**
 * Loader — animated bouncing-dots loader for the admin panel.
 *
 * Three accent-coloured dots bounce in sequence with a soft shadow. This is
 * the single loading primitive for the admin area; it replaces the previous
 * shimmer-skeleton placeholders and inline SVG spinners.
 *
 * Variants
 *   <Loader />                          inline dots (md), accent colour
 *   <Loader size="lg" label="…" />      bigger dots with a caption underneath
 *   <PageLoader label="…" />            full-section centred loader (page / table bodies)
 *   <ButtonLoader />                    tiny dots that inherit the button text colour
 *
 * Props
 *   size   'xs' | 'sm' | 'md' | 'lg'    dot size + gap        (default 'md')
 *   tone   'accent' | 'current'         dot colour: brand accent or currentColor
 *   label  string                       optional caption rendered below the dots
 *   className  string                   extra classes on the wrapper
 */

const SIZES = {
  xs: { dot: 'w-1.5 h-1.5', gap: 'gap-1' },
  sm: { dot: 'w-2 h-2',     gap: 'gap-1.5' },
  md: { dot: 'w-2.5 h-2.5', gap: 'gap-1.5' },
  lg: { dot: 'w-3.5 h-3.5', gap: 'gap-2' },
};

export function Loader({ size = 'md', tone = 'accent', label, className = '' }) {
  const s = SIZES[size] ?? SIZES.md;
  const dotClass = `admin-loader-dot ${tone === 'current' ? 'admin-loader-dot--current' : ''} ${s.dot}`;

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className={`flex items-end ${s.gap}`}>
        <span className={dotClass} />
        <span className={dotClass} />
        <span className={dotClass} />
      </div>
      {label && <span className="mt-3 text-sm text-slate-500">{label}</span>}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/**
 * PageLoader — full-width centred loader for page / table / card bodies that
 * are waiting on their first data load. Drop-in replacement for skeleton rows.
 */
export function PageLoader({ label = 'Loading…', className = '', minH = 'min-h-[240px]' }) {
  return (
    <div className={`w-full flex items-center justify-center ${minH} ${className}`}>
      <Loader size="lg" label={label} />
    </div>
  );
}

/**
 * ButtonLoader — tiny dots sized for inside buttons. Inherits the button's
 * text colour so it reads correctly on solid accent buttons.
 */
export function ButtonLoader({ className = '' }) {
  return <Loader size="xs" tone="current" className={className} />;
}

export default Loader;
