import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#040507",
        foreground: "#f4f4f5",
        "cyber-amber": "#ff9e00",
        "cyber-rust": "#c2410c",
        "cyber-gold": "#84cc16",
        border: "rgba(255, 158, 0, 0.1)",
        input: "rgba(255, 158, 0, 0.15)",
        ring: "#ff9e00",
        card: {
          DEFAULT: "rgba(9, 9, 11, 0.4)",
          foreground: "#f4f4f5"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionTimingFunction: {
        "premium-ease": "cubic-bezier(0.16, 1, 0.3, 1)",
      }
    },
  },
  plugins: [],
};
export default config;
