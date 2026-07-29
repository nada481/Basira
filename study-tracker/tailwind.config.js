/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#ffffff",
        ink: "#1a1a1a",
        maroon: "#8A1538",
        gold: "#C9A84C",
        teal: "#4C8C7D",
      },
      fontFamily: {
        serif: ['"DM Serif Display"', "serif"],
        sans: ['"DM Sans"', "sans-serif"],
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        drift: {
          "0%": { transform: "translate(0,0) scale(1)" },
          "100%": { transform: "translate(40px,24px) scale(1.1)" },
        },
        spulse: {
          "0%, 100%": { opacity: "0.25", transform: "scaleY(0.5) translateY(-8px)" },
          "50%": { opacity: "0.7", transform: "scaleY(1) translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.7s ease forwards",
        drift: "drift 9s ease-in-out infinite alternate",
        driftSlow: "drift 11s ease-in-out infinite alternate-reverse",
        spulse: "spulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};