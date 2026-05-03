/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#07090f',
        surface:  '#0d1117',
        surface2: '#161b27',
        bdr:      '#1e2a3a',
        accent:   '#22d3ee',
        kred:     '#4ade80',
        warn:     '#fbbf24',
        danger:   '#f87171',
        muted:    '#475569',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        sans: ['Sora', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.35s ease-out both',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};