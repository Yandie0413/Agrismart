/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
      },
      colors: {
        primary: {
          50: '#f0f9f4', 100: '#dcf1e4', 200: '#b8e2c9', 300: '#8ccfa8',
          400: '#5cb583', 500: '#3a9a65', 600: '#2D6A4F', 700: '#1B4332',
          800: '#153a2a', 900: '#0f2b1f',
        },
        accent: {
          50: '#fff8e6', 100: '#ffedb8', 400: '#FFC94A', 500: '#FFB703', 600: '#e5a400',
        },
        forest: {
          950: '#071912',
          900: '#0E2A1E',
          800: '#163827',
          700: '#1F4A34',
          600: '#2A5C41',
        },
        mint: {
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
        },
      }
    },
  },
  plugins: [],
}