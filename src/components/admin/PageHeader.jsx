/**
 * PageHeader — sticky-friendly page header with title, optional subtitle,
 * and an optional right-side action slot.
 *
 * Prop API unchanged: title, subtitle, action
 * Extended: breadcrumbs (optional ReactNode array/element) — only renders if passed
 */
export function PageHeader({ title, subtitle, action, breadcrumbs }) {
  return (
    <div
      className="-mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-4 mb-2"
      style={{ borderBottom: '1px solid var(--admin-border)', background: '#FFFFFF' }}
    >
      {breadcrumbs && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          {breadcrumbs}
        </div>
      )}
      <div className="erp-page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-7xl mx-auto">
        <div className="min-w-0">
          <h1 className="text-[22px] md:text-2xl font-semibold text-slate-900 truncate tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
