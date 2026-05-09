/**
 * StatCard — Dashboard KPI card.
 *
 * Props:
 *   label       string
 *   value       string | number
 *   hint        string (optional)
 *   delta       number (optional) — positive = up arrow green, negative = down arrow red
 *   icon        ReactNode (optional) — rendered inside colored accent box
 *   accentClass string (optional) — Tailwind gradient classes, e.g. 'from-indigo-500 to-indigo-600'
 */
export function StatCard({
  label,
  value,
  hint,
  delta,
  icon,
  accentClass = 'from-emerald-500 to-emerald-600',
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-slate-500 leading-snug flex-1 min-w-0">{label}</div>
        {icon != null && (
          <div
            className={`w-9 h-9 rounded-lg bg-gradient-to-br ${accentClass} flex items-center justify-center text-white text-base shrink-0`}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
        {value ?? '—'}
      </div>
      {(delta != null || hint) && (
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {delta != null && (
            <span
              className={`text-xs font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}%
            </span>
          )}
          {hint && <span className="text-xs text-slate-400">{hint}</span>}
        </div>
      )}
    </div>
  );
}
