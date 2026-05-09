/**
 * PageHeader — sticky-friendly page header with title, optional subtitle,
 * and an optional right-side action slot.
 */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="sticky top-0 z-10 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-4 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-7xl mx-auto">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
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
