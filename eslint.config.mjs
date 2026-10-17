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
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
