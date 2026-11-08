#!/usr/bin/env node
// Ratchet: per file and rule, the violation count may never exceed the baseline.
// `--update` can only lower counts. `--report` prints the totals per rule.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { RULES, scanFile } from "./ui-consistency-rules.mjs";

const BASELINE_PATH = "docs/design-system/UI-CONSISTENCY-BASELINE.json";
const EXEMPT_PATH = "docs/design-system/UI-CONSISTENCY-EXEMPTIONS.json";
export const exemptFiles = () => { try { return Object.keys(JSON.parse(readFileSync(EXEMPT_PATH, "utf8")).files); } catch { return []; } };
const args = new Set(process.argv.slice(2));

export function scanTracked(root = process.cwd()) {
  const files = execFileSync("git", ["ls-files", "-z", "--", "src"], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split("\0").filter((p) => /\.(tsx|ts|css)$/.test(p) && !/\.(test|spec)\.tsx?$/.test(p));
  const counts = {};
  const detail = {};
  const exempt = new Set(exemptFiles());
  for (const path of files) {
    if (exempt.has(path)) continue;
    // Development-only test harness pages: the request proxy answers 404 for /e2e in production builds
    // (pinned by tests/unit/sec12-e2e-harness-not-served.test.ts), so no user ever sees them.
    if (path.startsWith("src/app/e2e/")) continue;
    let source;
    try { source = readFileSync(`${root}/${path}`, "utf8"); } catch { continue; }
    for (const f of scanFile(path, source)) {
      counts[path] ??= {};
      counts[path][f.rule] = (counts[path][f.rule] ?? 0) + 1;
      (detail[path] ??= []).push(f);
    }
  }
  return { counts, detail };
}

function totals(counts) {
  const t = Object.fromEntries(Object.keys(RULES).map((r) => [r, 0]));
  for (const rules of Object.values(counts)) for (const [r, n] of Object.entries(rules)) t[r] += n;
  return t;
}

function readBaseline() {
  try { return JSON.parse(readFileSync(BASELINE_PATH, "utf8")); } catch { return { schemaVersion: 1, files: {} }; }
}

const { counts, detail } = scanTracked();

if (args.has("--report")) {
  const t = totals(counts);
  for (const [r, n] of Object.entries(t)) console.log(String(n).padStart(6), r);
  console.log(String(Object.values(t).reduce((a, b) => a + b, 0)).padStart(6), "TOTAL in", Object.keys(counts).length, "files");
  process.exit(0);
}

if (args.has("--init") || args.has("--update")) {
  const old = readBaseline().files;
  const next = {};
  for (const [path, rules] of Object.entries(counts)) {
    for (const [rule, n] of Object.entries(rules)) {
      const prev = old[path]?.[rule];
      if (args.has("--update") && !args.has("--init") && (prev === undefined || n > prev)) {
        console.error(`refusing to raise the baseline: ${path} ${rule} ${prev ?? 0} -> ${n}`);
        process.exit(1);
      }
      (next[path] ??= {})[rule] = n;
    }
  }
  const sorted = Object.fromEntries(Object.keys(next).sort().map((k) => [k, next[k]]));
  writeFileSync(BASELINE_PATH, JSON.stringify({ schemaVersion: 1, files: sorted }, null, 1) + "\n");
  const t = totals(counts);
  console.log("baseline written:", JSON.stringify(t));
  process.exit(0);
}

const baseline = readBaseline().files;
const failures = [];
for (const [path, rules] of Object.entries(counts)) {
  for (const [rule, n] of Object.entries(rules)) {
    const allowed = baseline[path]?.[rule] ?? 0;
    if (n > allowed) {
      const lines = detail[path].filter((f) => f.rule === rule).map((f) => `${f.line}:${f.snippet}`).slice(allowed, allowed + 5).join(", ");
      failures.push(`${path} ${rule}: ${n} found, ${allowed} allowed (${lines}) - ${RULES[rule]}`);
    }
  }
}
if (failures.length) {
  console.error("UI consistency check failed:\n" + failures.join("\n"));
  process.exit(1);
}
const t = totals(counts);
console.log("UI consistency ok. Remaining baseline debt:", JSON.stringify(t));
