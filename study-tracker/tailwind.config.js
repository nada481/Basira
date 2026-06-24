/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B1A4A',      // dark rose — buttons, accents
        'primary-light': '#C4526A', // lighter rose — hover states
        badge: '#E8A0B0',        // soft pink — active badge
        warn: '#FEF3C7',         // soft yellow — warning banner
      },
    },
  },
  plugins: [],
}