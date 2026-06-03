import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * SearchableSelect — labeled combobox with type-to-filter, keyboard navigation,
 * and the same visual treatment as <Select> for visual consistency.
 *
 * Controlled component. `value` is the selected option's `value` (string|number).
 * `options` is `[{ value, label, hint? }]` where `hint` shows as a smaller
 * secondary line under the label inside the dropdown.
 *
 * Keyboard:
 *   ArrowDown/Up — move highlight
 *   Enter        — pick the highlighted option (or first match)
 *   Escape       — close without changing the selection
 *   Tab          — close and commit any visual highlight as no-op
 *
 * Props:
 *   label, error, hint, required, id, className   — same as <Select>
 *   value          — currently selected option.value (or '' / null)
 *   onChange(val)  — fired with the new option.value when user picks
 *   options        — [{ value, label, hint? }]
 *   placeholder    — text shown when no option is selected
 *   noResultsText  — text shown when filter matches nothing
 *   disabled       — same as <Select>
 */
export function SearchableSelect({
  label,
  error,
  hint,
  required,
  id,
  className = '',
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  noResultsText = 'No matches',
  disabled = false,
}) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const [open, setOpen]                 = useState(false);
  const [query, setQuery]               = useState('');
  const [highlightedIdx, setHighlight]  = useState(0);

  const wrapRef  = useRef(null);
  const inputRef = useRef(null);
  const listRef  = useRef(null);

  // The currently-selected option object (or null when value is empty).
  // Compared with both string and number forms so callers can pass either.
  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value)) ?? null,
    [options, value],
  );

  // Filtered options based on the typed query. Case-insensitive substring
  // match against the label only; hint is decorative.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => String(o.label).toLowerCase().includes(q));
  }, [options, query]);

  // Reset highlight to top whenever the filtered list changes — prevents
  // a stale highlight that points past the new array's length.
  useEffect(() => {
    setHighlight(0);
  }, [filtered.length, open]);

  // Close on click outside.
  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Scroll the highlighted item into view as the user arrows up/down.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${highlightedIdx}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [highlightedIdx, open]);

  const commit = (opt) => {
    onChange?.(opt ? opt.value : '');
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setHighlight((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setHighlight((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      if (!open) return;
      e.preventDefault();
      const target = filtered[highlightedIdx];
      if (target) commit(target);
    } else if (e.key === 'Escape') {
      if (open) { e.preventDefault(); setOpen(false); setQuery(''); }
    } else if (e.key === 'Tab') {
      if (open) { setOpen(false); setQuery(''); }
    }
  };

  // Visible text in the input: query while typing (open), otherwise the
  // selected option's label, otherwise empty.
  const inputValue = open ? query : (selected ? selected.label : '');

  return (
    <div ref={wrapRef}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[13px] font-medium text-slate-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={inputId ? `${inputId}-listbox` : undefined}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          value={inputValue}
          placeholder={placeholder}
          onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { if (!disabled) setOpen(true); }}
          onKeyDown={onKeyDown}
          className={`w-full pl-3 pr-9 h-9 rounded-[0.625rem] border text-[13px] text-slate-800 bg-white
            focus:outline-none focus:ring-2 transition-all duration-150
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${error
              ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/30'
              : 'focus:ring-brand-200 focus:border-brand-500'
            } ${className}`}
          style={!error ? { borderColor: 'var(--admin-border, #E5E7EB)' } : undefined}
        />

        {/* Clear button when something is selected (shown in place of chevron) */}
        {!disabled && selected && !open && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear selection"
            onMouseDown={(e) => { e.preventDefault(); commit(null); }}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Chevron */}
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Close' : 'Open'}
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            if (disabled) return;
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        >
          <svg
            className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div
            id={inputId ? `${inputId}-listbox` : undefined}
            role="listbox"
            ref={listRef}
            className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-[0.625rem] border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2.5 text-[13px] text-slate-400">{noResultsText}</div>
            ) : (
              filtered.map((opt, idx) => {
                const active = idx === highlightedIdx;
                const isSelected = selected && String(selected.value) === String(opt.value);
                return (
                  <div
                    key={`${opt.value}`}
                    role="option"
                    aria-selected={isSelected}
                    data-idx={idx}
                    // mouseDown (not click) so it fires BEFORE the input's blur
                    // would close the dropdown via the outside-click handler.
                    onMouseDown={(e) => { e.preventDefault(); commit(opt); }}
                    onMouseEnter={() => setHighlight(idx)}
                    className={`px-3 py-2 cursor-pointer text-[13px] ${
                      active ? 'bg-brand-50' : 'bg-white'
                    } ${isSelected ? 'text-brand-700 font-medium' : 'text-slate-800'}`}
                  >
                    <div className="truncate">{opt.label}</div>
                    {opt.hint && (
                      <div className="text-[11px] text-slate-400 truncate">{opt.hint}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && <p className="text-slate-400 text-xs mt-1.5">{hint}</p>}
    </div>
  );
}
