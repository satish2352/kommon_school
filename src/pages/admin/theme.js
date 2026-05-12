/**
 * Admin panel design tokens — single source of truth.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Reference site: https://eleganzaoneerp.lovable.app/
 * Inspected: 2026-05-09
 *
 * COLOR PALETTE (extracted)
 *   Primary accent:   #0B4C4C / brand-600  (sidebar active, buttons, links)
 *   Sidebar bg:       #ffffff with border-r border-slate-200
 *   Page bg:          #f8fafc / slate-50
 *   Surface card:     #ffffff with 1px border border-slate-200, rounded-xl
 *   Text primary:     #0f172a / slate-900
 *   Text secondary:   #475569 / slate-600
 *   Text muted:       #94a3b8 / slate-400
 *   Border default:   #e2e8f0 / slate-200
 *   Border strong:    #cbd5e1 / slate-300
 *   Success:          bg #ecfdf5 / emerald-50, text #047857 / emerald-700
 *   Warning:          bg #fffbeb / emerald-50, text #b45309 / emerald-600
 *   Danger:           bg #fef2f2 / red-50, text #b91c1c / red-700
 *   Info:             bg #F0FAFA / brand-50, text #0A3838 / brand-700
 *
 * TYPOGRAPHY
 *   Font family:      'Lexend Deca', system-ui (already configured in tailwind.config.js)
 *   Page title:       24–30px, font-semibold, slate-900
 *   Table header:     11px, uppercase, font-semibold, slate-500, tracking-wide
 *   Body text:        14px, slate-700
 *   Muted text:       12px, slate-400
 *
 * SPACING RHYTHM
 *   Page padding:     px-4 py-6 md:px-6 md:py-8 lg:px-8
 *   Card padding:     p-5 or px-5 py-4
 *   Table cell:       px-4 py-3
 *   Stack gap:        space-y-6 between major sections
 *
 * SIDEBAR
 *   Width:            240px desktop, 200px tablet, 288px mobile drawer
 *   Active link:      bg-brand-50 text-brand-700, left border accent (border-l-2 border-brand-600)
 *   Icon:             w-4 h-4, colored with text-brand-600 when active
 *   Nav section label: text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-3 pt-4 pb-1
 *
 * CARD / TABLE / BUTTON
 *   Card radius:      rounded-xl (12px)
 *   Modal radius:     rounded-2xl (16px)
 *   Button radius:    rounded-lg (8px)
 *   Card shadow:      subtle — 0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)
 *   Hover shadow:     0 4px 12px rgba(15,23,42,0.08)
 *   Table header bg:  bg-slate-50 with border-b border-slate-200
 *   Row hover:        hover:bg-slate-50/80
 *   Zebra:            odd rows transparent, even rows bg-slate-50/40
 *
 * INTERACTION PATTERNS
 *   Button hover:     200ms ease-out color/shadow transitions
 *   Focus ring:       focus:ring-2 focus:ring-brand-300 focus:outline-none
 *   Row transition:   transition-colors duration-150
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const tokens = {
  colors: {
    surface:         'bg-white',
    surfaceMuted:    'bg-slate-50',
    surfaceElevated: 'bg-white shadow-sm',
    border:          'border-slate-200',
    borderStrong:    'border-slate-300',
    text: {
      primary:   'text-slate-900',
      secondary: 'text-slate-600',
      muted:     'text-slate-400',
    },
    accent: {
      bg:      'bg-emerald-600',
      bgHover: 'hover:bg-emerald-700',
      text:    'text-emerald-600',
      soft:    'bg-emerald-50',
    },
    success: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    warning: { bg: 'bg-emerald-50',   text: 'text-emerald-600',   dot: 'bg-emerald-500'   },
    danger:  { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500'     },
    info:    { bg: 'bg-brand-50',   text: 'text-brand-700',   dot: 'bg-brand-500'   },
  },
  radius: {
    sm:   'rounded-md',
    md:   'rounded-lg',
    lg:   'rounded-xl',
    xl:   'rounded-2xl',
    pill: 'rounded-full',
  },
  shadow: {
    card:  'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)]',
    hover: 'hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]',
    modal: 'shadow-2xl',
  },
  spacing: {
    pagePad:    'px-4 py-6 md:px-6 md:py-8 lg:px-8',
    cardPad:    'p-5',
    tableCellX: 'px-4',
    tableCellY: 'py-3',
    sectionGap: 'space-y-6',
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Backwards-compatible named exports
 * (kept so any inline usage in pages that hasn't yet been migrated won't break)
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Primary action button */
export const btn = {
  primary:   'px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors duration-200',
  secondary: 'px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors duration-200',
  danger:    'px-3 py-1.5 text-sm font-medium rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200',
};

/** Standard page-header title */
export const pageTitle = 'text-2xl md:text-3xl font-semibold text-slate-900';

/** Standard page-header subtitle */
export const pageSubtitle = 'text-sm text-slate-500 mt-0.5';

/** Table wrapper — horizontally scrollable on mobile */
export const tableWrapper = 'bg-white rounded-xl border border-slate-200 overflow-x-auto';

/** Table header cell */
export const th = 'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap';

/** Table body row */
export const tr = 'hover:bg-slate-50/80 transition-colors duration-150';

/** Table data cell — base */
export const td = 'px-4 py-3 text-sm text-slate-700 whitespace-nowrap';

/** Pagination wrapper */
export const paginationWrapper = 'mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500';

/** Active tab pill */
export const tabActive = 'px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white transition-colors duration-200';

/** Inactive tab pill */
export const tabInactive = 'px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors duration-200';

/** Error banner */
export const errorBanner = 'px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm';

/** Loading text */
export const loadingText = 'text-slate-500 text-sm';
