/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Modal responsive width classes — used dynamically in src/components/admin/Modal.jsx
    'sm:max-w-sm', 'sm:max-w-md', 'sm:max-w-lg', 'sm:max-w-xl', 'sm:max-w-2xl',
    'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-3xl',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — Stripe Dashboard / "Light Sidebar" professional theme.
        // Primary anchored on Tailwind blue-600 (#2563EB).
        // The admin sidebar uses a WHITE background, not a dark one — so the
        // dark variants of `brand` are mostly used for text/hover states on
        // light surfaces, not sidebar chrome.
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        // Keep existing emerald references working
        // (emerald is in Tailwind default palette, no extension needed)
      },
      fontFamily: {
        // Inter — matches Eleganza OneERP reference (https://eleganzaoneerp.lovable.app/).
        // Loaded via <link> in index.html.
        sans: ['Inter', 'Lexend Deca', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        // Reference uses Tailwind's default soft shadow recipe (very subtle, layered).
        // sm  → 0 1px 2px 0 rgb(0 0 0 / 0.05)
        // md  → 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
        // lg  → 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
        'card':       '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'modal':      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'sidebar':    '1px 0 0 0 rgb(229 231 235 / 1)',
        'header':     '0 1px 2px 0 rgb(0 0 0 / 0.04)',
      },
      borderRadius: {
        // Reference --radius: 0.625rem (10px). Cards use 0.75rem (12px).
        DEFAULT: '0.625rem',
      },
      backgroundImage: {
        'brand-gradient':   'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        'emerald-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'amber-gradient':   'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'rose-gradient':    'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
        'violet-gradient':  'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        'page-bg':          '#F9FAFB',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
