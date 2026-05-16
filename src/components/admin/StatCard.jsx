/**
 * StatCard — Dashboard KPI card with gradient icon tile.
 *
 * Props (unchanged):
 *   label       string
 *   value       string | number
 *   hint        string (optional)
 *   delta       number (optional) — positive = up arrow green, negative = down arrow red
 *   icon        ReactNode (optional)
 *   accentClass string (optional) — Tailwind gradient classes for icon tile
 */
export function StatCard({
  label,
  value,
  hint,
  delta,
  icon,
  accentClass = 'from-brand-500 to-brand-700',
}) {
  return (
    // h-full       — fill the grid cell vertically so all cards in the
    //                row reach the height of the tallest one.
    // flex flex-col — column layout so we can use mt-auto to push the
    //                value+hint block to a consistent vertical position
    //                regardless of how many lines the label wraps to.
    <div
      className="bg-white rounded-xl border p-5 shadow-card
        hover:shadow-card-hover transition-shadow duration-200 group
        h-full flex flex-col"
      style={{ borderColor: 'var(--admin-border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Label slot reserves space for up to 2 lines so a short label
            ("Revenue (7d)") and a wrapped label ("Today's enrollments")
            both occupy the same vertical box — keeps the icon row and
            value baseline aligned across cards. */}
        <div className="text-[13px] font-medium text-slate-500 leading-snug flex-1 min-w-0 min-h-[2.6em]">
          {label}
        </div>
        {icon != null && (
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${accentClass} flex items-center justify-center text-white shrink-0`}
            style={{ boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* mt-auto pulls the value+hint stack to the bottom so every card
          shows its number on the same Y line. Combined with the fixed
          label min-height above, this gives a perfectly aligned grid. */}
      <div className="mt-auto">
        <div className="mt-3 text-[26px] font-bold text-slate-900 tabular-nums tracking-tight leading-none">
          {value ?? '—'}
        </div>

        {/* Hint row always renders with a fixed min-height (even when
            empty) so cards with and without a hint keep the same
            overall height. Otherwise a hintless card would look
            visibly shorter inside the same row. */}
        <div className="flex items-center gap-2 mt-2 flex-wrap min-h-[18px]">
          {delta != null && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                delta >= 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {delta >= 0 ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {Math.abs(delta).toFixed(0)}%
            </span>
          )}
          {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
        </div>
      </div>
    </div>
  );
}
