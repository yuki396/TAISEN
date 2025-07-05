/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      sm: '300px', 
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {},
  },
  plugins: [],
}