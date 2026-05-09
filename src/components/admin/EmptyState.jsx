/**
 * EmptyState — centered icon + title + description + optional action.
 *
 * Designed to be used inside a <td colSpan={n}> in a table body.
 *
 * Props:
 *   icon        ReactNode (optional) — SVG icon
 *   title       string
 *   description string (optional)
 *   action      ReactNode (optional) — e.g. a Button
 *   colSpan     number (default 1) — for the wrapping <td>
 */
export function EmptyState({ icon, title, description, action, colSpan = 1 }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center">
        {icon && (
          <div className="flex justify-center mb-3 text-slate-300">{icon}</div>
        )}
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        {description && (
          <p className="text-slate-400 text-xs mt-1">{description}</p>
        )}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </td>
    </tr>
  );
}
