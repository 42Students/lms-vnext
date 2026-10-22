import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Plain apostrophes in JSX text are harmless; legacy copy uses them freely.
      "react/no-unescaped-entities": "off",
      // Date.now() inside event handlers and relative-time helpers is intentional.
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      // React Compiler-only diagnostics; the app does not use the compiler, and async server
      // components legitimately reassign locals and build JSX after try/catch data loads.
      "react-hooks/immutability": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  {
    // CommonJS codemods and audit scripts are Node tooling, not app code.
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["scripts/audit/**"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "docs/legacy-source/**",
  ]),
]);
