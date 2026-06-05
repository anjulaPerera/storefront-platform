import type { Config } from "tailwindcss";
import { tenantConfig } from "../../packages/config/src/tenant.config";

const { theme } = tenantConfig;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: theme.primaryColor, dark: theme.primaryColorDark },
        secondary: theme.secondaryColor,
        accent: theme.accentColor,
        background: theme.backgroundColor,
        surface: theme.surfaceColor,
        foreground: theme.textColor,
        muted: theme.mutedTextColor,
      },
      fontFamily: {
        sans: [theme.fontFamily, "sans-serif"],
      },
      borderRadius: {
        DEFAULT:
          {
            none: "0px",
            sm: "4px",
            md: "8px",
            lg: "12px",
            full: "9999px",
          }[theme.borderRadius] ?? "8px",
      },
    },
  },
  plugins: [],
};

export default config;
