/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eurogrip: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf6',
          500: '#0c8ee6',
          600: '#0070c4',
          700: '#0055b8', // Eurogrip brand blue
          800: '#054796',
          900: '#0a3d78',
          950: '#06264f',
        },
        ustaad: {
          amber: '#F59E0B',
          gold: '#D97706',
          dark: '#0F1E36',
          surface: '#1E293B',
          canvas: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

