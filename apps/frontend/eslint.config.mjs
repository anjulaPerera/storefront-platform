import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  {
    // Apply configurations to your codebase targets
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooksPlugin, // ✅ Safely injects the missing hooks definition mapping
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Pull in the base recommended rules from Next.js explicitly
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // Explicitly tie down the react-hooks definitions
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
  {
    // Globally ignore build artifacts and cache outputs
    ignores: [".next/*", "node_modules/*", "dist/*"],
  },
];
