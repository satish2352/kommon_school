/**
 * Table — horizontally-scrollable table wrapper with sticky header support.
 *
 * Exports:
 *   Table  — wraps <table> in overflow-x-auto container
 *   Th     — header cell
 *   Td     — data cell
 *   Tr     — body row with optional zebra striping
 */

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full text-sm">
        {children}
      </table>
    </div>
  );
}

export function Th({ children, align = 'left', className = '' }) {
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${alignCls} ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, align = 'left', className = '' }) {
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td className={`px-4 py-3 text-sm text-slate-700 whitespace-nowrap ${alignCls} ${className}`}>
      {children}
    </td>
  );
}

export function Tr({ children, striped = false, className = '' }) {
  return (
    <tr
      className={`hover:bg-slate-50/80 transition-colors duration-150 ${striped ? 'bg-slate-50/40' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}
