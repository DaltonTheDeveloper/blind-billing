import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bb: {
          bg: '#060807',
          surface: '#0d0f0c',
          card: '#141714',
          border: '#1f221e',
          text: '#e2e4e0',
          muted: '#6b6f68',
          lime: '#a3e635',
          'lime-dim': 'rgba(163,230,53,0.08)',
          red: '#f87171',
          amber: '#fbbf24',
          blue: '#60a5fa',
        },
      },
      fontFamily: {
        instrument: ['"Instrument Serif"', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Departure Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
