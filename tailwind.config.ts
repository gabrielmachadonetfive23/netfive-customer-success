import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        netfive: {
          bg: "#0a0a0b",
          surface: "#131316",
          border: "rgba(255,255,255,0.08)",
          red: "#e11d2e",
          "red-dark": "#a3141f",
          gray: {
            100: "#f4f4f5",
            300: "#d4d4d8",
            500: "#a1a1aa",
            700: "#52525b",
            900: "#18181b",
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
