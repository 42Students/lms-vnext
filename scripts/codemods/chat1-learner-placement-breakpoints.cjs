#!/usr/bin/env node
"use strict";
// chat-1 only: keep the learner placement controls aligned with the legacy
// $learn-mobile-bp: 767px, not Tailwind's 639px sm boundary.
// Usage: node scripts/codemods/chat1-learner-placement-breakpoints.cjs [--apply]
// The default is a dry run. Source-level only; no application execution.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const apply = process.argv.includes("--apply");
const files = ["learner-placement-jobs.tsx", "learner-placement-offers.tsx", "learner-placement-alerts.tsx"];
const pairs = [
  ["max-sm:min-h-11", "max-md:min-h-11"],
  ["sm:min-h-9", "md:min-h-9"],
  ["sm:p-6", "md:p-6"],
  ["sm:grid-cols-3", "md:grid-cols-3"],
  ["sm:grid-cols-2", "md:grid-cols-2"],
  ["sm:flex-row", "md:flex-row"],
  ["sm:items-start", "md:items-start"],
  ["sm:justify-between", "md:justify-between"],
  ["sm:text-[16px]", "md:text-[16px]"],
];
const results = [];
let errors = 0;
for (const base of files) {
  const file = path.join(process.cwd(), "src/components/placements", base);
  try {
    const before = fs.readFileSync(file, "utf8");
    let after = before;
    const counts = {};
    for (const [from, to] of pairs) {
      const count = after.split(from).length - 1;
      if (count) {
        after = after.split(from).join(to);
        counts[from] = count;
      }
    }
    const parsed = ts.createSourceFile(file, after, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    if (parsed.parseDiagnostics.length) throw Error("TSX parse diagnostics; refusing write");
    if (apply && after !== before) fs.writeFileSync(file, after, "utf8");
    results.push({ file: base, changed: after !== before, counts });
  } catch (error) {
    errors++;
    results.push({ file: base, error: String(error) });
  }
}
process.stdout.write(JSON.stringify({ mode: apply ? "apply" : "dry-run", results }, null, 2) + "\n");
if (errors) process.exitCode = 1;
