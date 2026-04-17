/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 18px 60px rgba(15, 23, 42, 0.08)",
      },
      colors: {
        brand: {
          900: "#111827",
          700: "#1f2937",
          500: "#3b82f6",
          400: "#60a5fa"
        }
      }
    }
  },
  plugins: [],
};
