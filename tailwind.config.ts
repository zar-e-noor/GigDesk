import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1E293B",
        "ink-soft": "#475569",
        accent: "#0D9488",
        "accent-dark": "#0B7A70",
        bg: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E2E8F0",
      },
    },
  },
  plugins: [],
};
export default config;
