#!/usr/bin/env node
// Test integrity (SEC-23-025): a green run must not be achievable by skipping or focusing tests.
//   node scripts/security/test-integrity.mjs            check against docs/security/test-integrity-baseline.json
//   node scripts/security/test-integrity.mjs --write    lower the baseline on purpose
// Fails on any committed `.only(` (a focused test silently skips all others) and when the number of skipped tests
// (`.skip(`, `it.todo`, `xit`, `xdescribe`, conditional `skipIf`) rises above the baseline.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const BASELINE = "docs/security/test-integrity-baseline.json";
const files = execSync("git ls-files tests", { encoding: "utf8" }).split("\n").filter((f) => /\.(test|spec)\.(tsx?|mjs|cjs|js)$/.test(f));
const only = [];
let skipped = 0;
const skippedIn = new Map();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  if (/\b(?:it|test|describe)\.only\s*\(/.test(src)) only.push(f);
  const n = (src.match(/\b(?:it|test|describe)\.(?:skip|todo)\s*\(|\bx(?:it|describe)\s*\(|\.skipIf\s*\(|\bdescribe\.runIf\s*\(|\bit\.runIf\s*\(/g) || []).length;
  if (n) {
    skipped += n;
    skippedIn.set(f, n);
  }
}
const summary = { testFiles: files.length, focusedFiles: only.length, skippedOrConditional: skipped };
console.log(JSON.stringify(summary));
if (only.length) {
  console.error("focused tests (.only) committed:\n  " + only.join("\n  "));
  process.exit(1);
}
const base = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : null;
if (process.argv.includes("--write")) {
  if (base && skipped > base.skippedOrConditional) {
    console.error(`refusing to raise the skip baseline: ${base.skippedOrConditional} -> ${skipped}`);
    process.exit(1);
  }
  writeFileSync(BASELINE, JSON.stringify({ note: "Skipped or conditional tests may only go down. Conditional database suites (runIf/skipIf on isolation flags) are counted: they are skipped unless their disposable database is configured.", ...summary }, null, 1) + "\n");
  console.log("baseline written");
} else if (base && skipped > base.skippedOrConditional) {
  console.error(`skipped or conditional tests rose from ${base.skippedOrConditional} to ${skipped}`);
  process.exit(1);
} else {
  console.log("test integrity ok");
}
