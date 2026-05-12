import { useEffect } from 'react';

/**
 * Modal — overlay + centered card.
 *
 * Props (unchanged):
 *   isOpen      boolean — controls visibility
 *   onClose     function — called on ESC, backdrop click, or X button
 *   title       string
 *   children    ReactNode — modal body content
 *   footer      ReactNode — cancel + primary action buttons
 *   widthClass  string (default 'max-w-lg') — Tailwind max-width class
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  widthClass = 'max-w-lg',
}) {
  /* Body scroll lock */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /* ESC key handler */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop — softer, matches shadcn default */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`relative z-10 bg-white w-full ${widthClass} mx-4 max-h-[95vh] overflow-y-auto
          rounded-xl shadow-modal border transition-all duration-200 animate-slide-up`}
        style={{ borderColor: 'var(--admin-border, #E5E7EB)' }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10 rounded-t-xl"
          style={{
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'saturate(180%) blur(8px)',
            WebkitBackdropFilter: 'saturate(180%) blur(8px)',
            borderBottom: '1px solid var(--admin-border, #E5E7EB)',
          }}
        >
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-300"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="px-6 py-4 flex justify-end gap-3 shrink-0 rounded-b-xl"
            style={{ background: '#F9FAFB', borderTop: '1px solid var(--admin-border, #E5E7EB)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
