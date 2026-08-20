/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf8f6",
          100: "#f2e8e5",
          200: "#e5d0c9",
          300: "#d2b0a4",
          400: "#bc8a78",
          500: "#a76c57",
          600: "#965b47",
          700: "#7d4a39",
          800: "#693f31",
          900: "#57352a",
          950: "#301c16",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 4px 30px rgba(0, 0, 0, 0.03)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
