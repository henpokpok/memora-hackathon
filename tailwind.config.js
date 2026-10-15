/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0B0E14',
          card: '#131822',
          border: '#1F2937',
          cyan: '#00F0FF',
          orchid: '#D946EF',
          gold: '#FBBF24',
          emerald: '#10B981',
          rose: '#F43F5E'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
