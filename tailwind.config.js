/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'ff-orange': '#FF6B00',
        'ff-yellow': '#FFD700',
        'ff-dark': '#0A0A0F',
        'ff-card': '#12121A',
        'ff-border': '#1E1E2E',
      },
      fontFamily: {
        'game': ['Rajdhani', 'sans-serif'],
        'body': ['Exo 2', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
