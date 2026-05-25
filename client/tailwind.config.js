/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Unified Kira palette — used by BOTH patient and doctor portals.
        ink: {
          950: '#070e0b',
          900: '#0a1410',
          800: '#0f1c17',
          700: '#14201a',
          600: '#1a2a23',
          500: '#23362d',
          400: '#314a3e',
        },
        mint: {
          50: '#eafbef',
          100: '#c8e6c9',
          200: '#a8d6b1',
          300: '#7aad8a',
          400: '#5a9070',
          500: '#3d8b5e',
          600: '#2d6a48',
        },
        ember: {
          50: '#fff1ea',
          200: '#ffc6a8',
          400: '#ff8d59',
          500: '#ff6b35',
          600: '#e54f1f',
        },
        // Care severity (tuned for dark surfaces)
        care: {
          green: '#5fd189',
          'green-bg': 'rgba(95, 209, 137, 0.12)',
          amber: '#f4c25b',
          'amber-bg': 'rgba(244, 194, 91, 0.12)',
          red: '#ff7a5c',
          'red-bg': 'rgba(255, 122, 92, 0.12)',
          critical: '#ff4d4d',
        },
        muted: {
          DEFAULT: '#7a9080',
          fg: '#9bbdab',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(122, 173, 138, 0.25), 0 8px 32px -8px rgba(0, 0, 0, 0.6)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        ember: '0 0 0 1px rgba(255,107,53,0.25), 0 10px 30px -10px rgba(255,107,53,0.35)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.06)' },
        },
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
