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
        // SSOT-driven palette
        primary: { DEFAULT: theme.primaryColor, dark: theme.primaryColorDark },
        secondary: theme.secondaryColor,
        accent: theme.accentColor,
        background: theme.backgroundColor,
        surface: theme.surfaceColor,
        foreground: theme.textColor,
        muted: theme.mutedTextColor,
        // Cinematic extras
        "space-1": "#050816",
        "space-2": "#080d1f",
        "space-3": "#0D111F",
        "space-4": "#111827",
        glass: "rgba(255,255,255,0.03)",
        "glass-2": "rgba(255,255,255,0.06)",
        "border-dim": "rgba(255,255,255,0.07)",
        "border-mid": "rgba(255,255,255,0.12)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
      fontSize: {
        "hero-sm": [
          "clamp(2.5rem, 6vw, 4rem)",
          { lineHeight: "1.05", letterSpacing: "-0.03em" },
        ],
        hero: [
          "clamp(3.5rem, 9vw, 7rem)",
          { lineHeight: "1.0", letterSpacing: "-0.04em" },
        ],
        "hero-lg": [
          "clamp(4.5rem, 12vw, 9.5rem)",
          { lineHeight: "0.95", letterSpacing: "-0.05em" },
        ],
        display: [
          "clamp(2rem, 5vw, 3.5rem)",
          { lineHeight: "1.1", letterSpacing: "-0.03em" },
        ],
      },
      backgroundImage: {
        "hero-radial": `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.35) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 85% 85%, rgba(124,58,237,0.2) 0%, transparent 55%), #050816`,
        "glow-blue":
          "radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 60%)",
        "glow-amber":
          "radial-gradient(circle, rgba(245,158,11,0.35) 0%, transparent 60%)",
        "glow-purple":
          "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 60%)",
        "card-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)",
        "text-gradient":
          "linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #F59E0B 100%)",
      },
      boxShadow: {
        "glow-sm": "0 0 20px rgba(37,99,235,0.2)",
        glow: "0 0 40px rgba(37,99,235,0.25)",
        "glow-lg": "0 0 80px rgba(37,99,235,0.3)",
        "glow-amber": "0 0 40px rgba(245,158,11,0.25)",
        "glow-purple": "0 0 40px rgba(124,58,237,0.25)",
        card: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "card-hover":
          "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "float-fast": "float 4s ease-in-out infinite",
        twinkle: "twinkle 4s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "fade-up": "fade-up 0.7s ease forwards",
        "fade-in": "fade-in 0.6s ease forwards",
        "scale-in": "scale-in 0.5s ease forwards",
        "slide-right": "slide-right 0.6s ease forwards",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-18px) rotate(1deg)" },
          "66%": { transform: "translateY(-8px) rotate(-0.5deg)" },
        },
        twinkle: {
          "0%,100%": { opacity: "0.2" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "glow-pulse": {
          "0%,100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(32px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-right": {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      backdropBlur: { xs: "2px" },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
