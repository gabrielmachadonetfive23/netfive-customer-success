import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        netfive: {
          bg: "rgb(var(--netfive-bg-rgb) / <alpha-value>)",
          surface: "rgb(var(--netfive-surface-rgb) / <alpha-value>)",
          border: "var(--netfive-border)",
          overlay: "rgb(var(--netfive-overlay-rgb) / <alpha-value>)",
          red: "#e11d2e",
          "red-dark": "#a3141f",
          gray: {
            100: "var(--netfive-gray-100)",
            300: "var(--netfive-gray-300)",
            500: "var(--netfive-gray-500)",
            700: "rgb(var(--netfive-gray-700-rgb) / <alpha-value>)",
            900: "var(--netfive-gray-900)",
          },
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
        "glass-sm": "0 2px 12px 0 rgba(0, 0, 0, 0.35)",
        "glow-red": "0 0 0 1px rgba(225, 29, 46, 0.5), 0 0 32px 2px rgba(225, 29, 46, 0.35)",
        "glow-red-sm": "0 0 0 1px rgba(225, 29, 46, 0.45), 0 0 18px 0 rgba(225, 29, 46, 0.3)",
      },
      backdropBlur: {
        glass: "20px",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
