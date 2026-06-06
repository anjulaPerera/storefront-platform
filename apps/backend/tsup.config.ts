import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"],
  outDir: "dist",
  clean: true,
  sourcemap: false,
  splitting: false,
  // Bundle workspace packages (they have no npm entry)
  noExternal: ["@storefront/config", "@storefront/types"],
  // Externalize npm packages — they're in node_modules at runtime
  external: [
    "pg",
    "bcrypt",
    "express",
    "jsonwebtoken",
    "resend",
    "@google/generative-ai",
    "zod",
    "cors",
    "helmet",
    "morgan",
    "express-rate-limit",
    "cookie-parser",
    "dotenv",
  ],
  esbuildOptions(options) {
    options.platform = "node";
  },
});
