import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import ts from "typescript";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Next.js keeps JSX intact; precompile source TSX for Vitest before Vite import analysis.
  plugins: [{
    name: "vitest-source-tsx-react-jsx",
    enforce: "pre",
    transform(source, id) {
      if (!id.split("?")[0].endsWith(".tsx") || !id.includes("/src/")) return null;
      const result = ts.transpileModule(source, {
        fileName: id,
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          sourceMap: true,
        },
      });
      return { code: result.outputText, map: result.sourceMapText ?? null };
    },
  }],
  test: {
    environment: "node",
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      "tests/ux-playbook-primitives.test.tsx",
      "tests/ux-playbook-compatibility.test.tsx",
      "tests/ux-color-contrast.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      "server-only": path.resolve(root, "tests/support/server-only.ts"),
    },
  },
});
