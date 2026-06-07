import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin"; 
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooksPlugin,
      "@typescript-eslint": tsPlugin, // ← register the plugin here
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "react-hooks/set-state-in-effect": "off", // ← add this
      "no-console": "off",
    },
  },
  {
    ignores: [".next/*", "node_modules/*", "dist/*"],
  },
];
