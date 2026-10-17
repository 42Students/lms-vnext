// Fast, low-memory syntax-only check of every .ts/.tsx under src, tests, scripts.
// Catches unbalanced JSX/braces from lane merges before a full typecheck is run.
// Usage: node scripts/audit/syntax-check.mjs
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const roots = ["src", "tests", "scripts"];
let bad = 0;
let count = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) check(full);
  }
}

function check(file) {
  count++;
  const text = fs.readFileSync(file, "utf8");
  const result = ts.transpileModule(text, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  const errors = (result.diagnostics ?? []).filter((d) => d.category === ts.DiagnosticCategory.Error);
  if (errors.length) {
    bad++;
    const d = errors[0];
    const { line, character } = ts.getLineAndCharacterOfPosition(d.file, d.start ?? 0);
    console.log(`${file}(${line + 1},${character + 1}): ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
  }
}

for (const root of roots) if (fs.existsSync(root)) walk(root);
console.log(`checked ${count} files, ${bad} with syntax errors`);
process.exit(bad ? 1 : 0);
