import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bb: {
          bg: '#0c0a14',
          surface: '#13111c',
          card: '#1a1726',
          border: '#2d2940',
          text: '#f0eef5',
          muted: '#a09bb8',
          'muted-dark': '#6b6580',
          brand: '#9333ea',
          'brand-light': '#a855f7',
          'brand-dim': 'rgba(147,51,234,0.08)',
          accent: '#ec4899',
          lime: '#22c55e',
          red: '#ef4444',
          amber: '#eab308',
          blue: '#60a5fa',
        },
      },
      fontFamily: {
        instrument: ['"Instrument Serif"', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Departure Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'node-glow': 'nodeGlow 2s ease-in-out infinite',
      },
      keyframes: {
        nodeGlow: {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(147, 51, 234, 0.3)' },
          '50%': { boxShadow: '0 0 20px 6px rgba(147, 51, 234, 0.6)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
