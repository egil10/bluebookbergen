import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1d3a",
        bergen: {
          50: "#f4f7fb",
          100: "#e6eef7",
          200: "#cfdcee",
          300: "#a8c1de",
          400: "#7aa0c9",
          500: "#5180b3",
          600: "#3d6798",
          700: "#33547b",
          800: "#2e4665",
          900: "#293c55",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Inter",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
