/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        masjid: {
          bg: '#0f1210',
          surface: '#0a0c0a',
          card: '#1a1d1a',
          border: '#2a2d2a',
          green: '#00ff7f',
          gold: '#d4af77',
          dark: '#0f1210',
        },
      },
    },
  },
  plugins: [],
}
