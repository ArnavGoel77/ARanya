/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#166534',
          light: '#22c55e',
          dark: '#14532d',
        },
        accent: {
          DEFAULT: '#d97706',
          light: '#f59e0b',
          dark: '#b45309',
        },
        muted: {
          DEFAULT: '#9ca3af',
          light: '#f3f4f6',
          dark: '#4b5563',
        },
        surface: {
          DEFAULT: '#fafaf9',
          dark: '#e7e5e4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}