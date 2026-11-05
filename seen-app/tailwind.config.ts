import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", md: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B2E4A",
          50: "#F4F7FA",
          100: "#E3EBF2",
          200: "#C3D4E2",
          300: "#93AFC5",
          400: "#5C7F9C",
          500: "#375B78",
          600: "#244763",
          700: "#173A54",
          800: "#0F2C42",
          900: "#0B2E4A",
          950: "#061A2B",
        },
        sun: {
          DEFAULT: "#C16A1E",
          50: "#FDF6EF",
          100: "#F9E8D5",
          200: "#F2CDA4",
          300: "#E9AB6E",
          400: "#DD8A3F",
          500: "#C16A1E",
          600: "#A2541A",
          700: "#7E3F16",
          800: "#5C2E12",
          900: "#3D1F0D",
        },
        kente: {
          gold: "#E0A526",
          green: "#1E6B4F",
          clay: "#A8442A",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Consolas", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,46,74,0.04), 0 8px 24px -12px rgba(11,46,74,0.18)",
        lift: "0 2px 4px rgba(11,46,74,0.06), 0 18px 40px -20px rgba(11,46,74,0.28)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
