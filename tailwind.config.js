/** @type {import('tailwindcss').Config} */
const includeVisualFixtures = process.env.npm_lifecycle_event === 'dev:visual';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    ...(includeVisualFixtures ? ["./tests/visual/**/*.{html,ts,tsx}"] : []),
    "./*.html"
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f6f8fa',
        surface: '#ffffff',
        border: '#d0d7de',
        ink: '#1f2328',
        muted: '#59636e',
        accent: {
          50: '#ddf4ff',
          100: '#b6e3ff',
          500: '#0969da',
          600: '#0550ae',
          700: '#033d8b',
        },
        success: {
          50: '#dafbe1',
          500: '#1a7f37',
          600: '#116329',
        },
        warning: {
          50: '#fff8c5',
          500: '#9a6700',
          600: '#7d4e00',
        },
        danger: {
          50: '#ffebe9',
          500: '#cf222e',
          600: '#a40e26',
        },
        primary: {
          50: '#ddf4ff',
          100: '#b6e3ff',
          500: '#0969da',
          600: '#0550ae',
          700: '#033d8b',
        },
      },
      borderRadius: {
        tool: '6px',
      },
      boxShadow: {
        overlay: '0 8px 24px rgba(31, 35, 40, 0.14)',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
