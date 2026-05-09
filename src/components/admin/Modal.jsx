import { useEffect } from 'react';

/**
 * Modal — overlay + centered card.
 *
 * Props:
 *   isOpen      boolean — controls visibility
 *   onClose     function — called on ESC, backdrop click, or X button
 *   title       string
 *   children    ReactNode — modal body content
 *   footer      ReactNode — cancel + primary action buttons
 *   widthClass  string (default 'max-w-lg') — Tailwind max-width class
 *
 * Behavior matches existing admin modal pattern in Courses/EducationMaster/DurationMaster:
 *   - z-50 layering
 *   - bg-slate-900/50 backdrop-blur-sm backdrop
 *   - body scroll lock while open
 *   - ESC key closes
 *   - backdrop click closes
 *   - fade + scale animation on open/close
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  widthClass = 'max-w-lg',
}) {
  /* Body scroll lock — owned here so pages don't need their own */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`relative z-10 bg-white w-full ${widthClass} mx-4 max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl transition-all duration-200`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
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
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
