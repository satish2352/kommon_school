/**
 * EmptyState — centered icon + title + description + optional action.
 *
 * Designed to be used inside a <td colSpan={n}> in a table body.
 *
 * Props (unchanged):
 *   icon        ReactNode (optional) — SVG icon
 *   title       string
 *   description string (optional)
 *   action      ReactNode (optional) — e.g. a Button
 *   colSpan     number (default 1) — for the wrapping <td>
 */
export function EmptyState({ icon, title, description, action, colSpan = 1 }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        {icon && (
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-brand-600" style={{ background: '#EFF6FF' }}>
              {icon}
            </div>
          </div>
        )}
        <p className="text-slate-700 text-[14px] font-semibold">{title}</p>
        {description && (
          <p className="text-slate-500 text-[13px] mt-1.5 max-w-xs mx-auto leading-relaxed">{description}</p>
        )}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </td>
    </tr>
  );
}
