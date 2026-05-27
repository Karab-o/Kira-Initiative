/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Kira Light Design System ──────────────────────────────
        cream:  '#F8F5F2',          // Cloud Milk — primary background
        coal: {
          DEFAULT: '#222222',       // Dusty Coal — primary text
          light:   '#3D3D3D',
          muted:   '#6B6B6B',
          subtle:  '#AAAAAA',
        },
        sage: {
          50:  '#F0F5F1',
          100: '#DDE8E0',           // Soft Mint
          200: '#AFC8A9',           // Moss Green
          300: '#8FAF8B',           // Primary Green
          400: '#5E7A64',           // Forest Sage
          500: '#4F8A6B',           // Emerald Accent
          600: '#3A6650',           // Hover / pressed
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft:    '#F8F5F2',
          muted:   '#EEE8E3',
        },
        border: {
          DEFAULT: '#E5DDD7',
          soft:    '#EDE7E3',
          strong:  '#C5BBB3',
        },
        // Care severity (tuned for light surfaces)
        care: {
          green:      '#2A7A50',
          'green-bg': 'rgba(42, 122, 80, 0.09)',
          amber:      '#9A6510',
          'amber-bg': 'rgba(154, 101, 16, 0.09)',
          red:        '#C03A2A',
          'red-bg':   'rgba(192, 58, 42, 0.09)',
          critical:   '#A82020',
        },

        // ── Legacy dark tokens (doctor portal — migrate later) ────
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
          50:  '#eafbef',
          100: '#c8e6c9',
          200: '#a8d6b1',
          300: '#7aad8a',
          400: '#5a9070',
          500: '#3d8b5e',
          600: '#2d6a48',
        },
        ember: {
          50:  '#fff1ea',
          200: '#ffc6a8',
          400: '#ff8d59',
          500: '#ff6b35',
          600: '#e54f1f',
        },
        muted: {
          DEFAULT: '#7a9080',
          fg:      '#9bbdab',
        },
      },
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl:   '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        soft:     '0 1px 3px rgba(34,34,34,0.07), 0 4px 12px rgba(34,34,34,0.05)',
        card:     '0 2px 8px rgba(34,34,34,0.06), 0 1px 2px rgba(34,34,34,0.04)',
        elevated: '0 4px 20px rgba(34,34,34,0.10), 0 1px 4px rgba(34,34,34,0.06)',
        green:    '0 0 0 1px rgba(79,138,107,0.18), 0 6px 20px rgba(79,138,107,0.14)',
        // Legacy dark
        glow:  '0 0 0 1px rgba(122,173,138,0.25), 0 8px 32px -8px rgba(0,0,0,0.6)',
        ember: '0 0 0 1px rgba(255,107,53,0.25), 0 10px 30px -10px rgba(255,107,53,0.35)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'fade-up':    'fade-up 0.5s ease-out',
        shimmer:      'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%':      { opacity: 1,   transform: 'scale(1.06)' },
        },
        'fade-up': {
          '0%':   { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
