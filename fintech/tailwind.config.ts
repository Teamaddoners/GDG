import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#07110b",
        card: "rgba(255,255,255,0.06)",
        eco: "#00f59b"
      },
      boxShadow: {
        neon: "0 0 30px rgba(0,245,155,0.3)"
      }
    }
  },
  plugins: []
};

export default config;
