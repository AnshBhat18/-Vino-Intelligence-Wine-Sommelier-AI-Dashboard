/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Toggle via 'dark' class on <html>
  theme: {
    extend: {
      colors: {
        merlot: {
          50: '#fdf2f4',
          100: '#fbe6ea',
          200: '#f7d0d8',
          300: '#f1abbc',
          400: '#e77c97',
          500: '#d84f72',
          600: '#c13357',
          700: '#a22241',
          800: '#8b1a2a', // Luxury deep merlot red
          900: '#6b0f1c',
          950: '#2a0a12', // Background shade
        },
        gold: {
          400: '#d9bd8b',
          500: '#c9a96e', // SOMMELIER GOLD
          600: '#ab8d56',
        },
        luxury: {
          dark: '#0d0608', // Radial start
          deep: '#060203', // Solid background
          card: '#160b0e', // Dialogs/Panels
          cardlight: '#ffffff',
          bglight: '#f8fafc',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
