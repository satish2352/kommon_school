/**
 * Skeleton — shimmer loading placeholder.
 *
 * Props:
 *   w         string — Tailwind width class (default 'w-full')
 *   h         string — Tailwind height class (default 'h-3')
 *   className string — additional classes
 */
export function Skeleton({ w = 'w-full', h = 'h-3', className = '' }) {
  return (
    <div className={`bg-slate-200 rounded animate-pulse ${w} ${h} ${className}`} />
  );
}
