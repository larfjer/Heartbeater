import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";

export default [
  {
    ignores: ["node_modules/**", "dist/**", "out/**", ".vscode/**", "*.old.js"],
  },
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        require: "readonly",
        module: "writable",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "prefer-const": "warn",
    },
  },
  {
    files: ["renderer.js", "src/renderer/**/*.js"],
    languageOptions: {
      globals: {
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        alert: "readonly",
      },
    },
  },
];
