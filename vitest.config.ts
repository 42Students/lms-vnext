import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { configDefaults, defineConfig } from "vitest/config";
import ts from "typescript";

const root = path.dirname(fileURLToPath(import.meta.url));

// Reviewed, shrink-only list of stale UI-copy tests (tests/quarantine/ui-copy-drift.json). `npm test` skips them so a red
// run means something; `npm run test:quarantine` (INCLUDE_QUARANTINE=1) runs them.
const quarantined: string[] = process.env["INCLUDE_QUARANTINE"] === "1"
  ? []
  : (JSON.parse(readFileSync(path.join(root, "tests/quarantine/ui-copy-drift.json"), "utf8")).files as Array<{ file: string }>).map((entry) => entry.file);

export default defineConfig({
  // Next.js keeps JSX intact; precompile source TSX for Vitest before Vite import analysis.
  plugins: [{
    name: "vitest-source-tsx-react-jsx",
    enforce: "pre",
    transform(source, id) {
      if (!id.split("?")[0].endsWith(".tsx") || !(id.includes("/src/") || id.includes("/tests/"))) return null;
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
    exclude: [...configDefaults.exclude, ...quarantined],
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
