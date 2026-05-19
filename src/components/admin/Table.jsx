/**
 * Table — horizontally-scrollable table wrapper with sticky header support.
 *
 * Exports:
 *   Table  — wraps <table> in overflow-x-auto container
 *   Th     — header cell (brand-tinted sticky header)
 *   Td     — data cell
 *   Tr     — body row with optional zebra striping + hover highlight
 *
 * Prop API unchanged: Table(children,className), Th(children,align,className),
 *   Td(children,align,className), Tr(children,striped,className)
 */

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full text-[13px]">
        {children}
      </table>
    </div>
  );
}

export function Th({ children, align = 'left', className = '' }) {
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      className={`px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-[0.06em] whitespace-nowrap ${alignCls} ${className}`}
      style={{ background: '#F8F9FA', borderBottom: '1px solid var(--admin-border)' }}
    >
      {children}
    </th>
  );
}

export function Td({ children, align = 'left', className = '' }) {
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td
      className={`px-4 py-3 text-[13px] text-slate-700 whitespace-nowrap ${alignCls} ${className}`}
      style={{ borderBottom: '1px solid var(--admin-border-soft, #EEF1F4)' }}
    >
      {children}
    </td>
  );
}

export function Tr({ children, striped = false, className = '', onClick, ...rest }) {
  return (
    <tr
      onClick={onClick}
      className={`group transition-colors duration-150
        hover:bg-slate-50/70
        ${striped ? 'bg-slate-50/30' : 'bg-white'}
        ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}
