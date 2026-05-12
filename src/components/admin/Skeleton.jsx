/**
 * Skeleton — shimmer loading placeholder.
 *
 * Props (unchanged):
 *   w         string — Tailwind width class (default 'w-full')
 *   h         string — Tailwind height class (default 'h-3')
 *   className string — additional classes
 */
export function Skeleton({ w = 'w-full', h = 'h-3', className = '' }) {
  return (
    <div
      className={`rounded-lg ${w} ${h} ${className} skeleton-shimmer`}
      aria-hidden="true"
    />
  );
}
