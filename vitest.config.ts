import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // tsconfig uses JSX preserve for Next.js; Vitest must emit runnable JSX in TSX imports.
  esbuild: { jsx: "automatic", tsconfigRaw: { compilerOptions: { jsx: "react-jsx" } } },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      "server-only": path.resolve(root, "tests/support/server-only.ts"),
    },
  },
});
