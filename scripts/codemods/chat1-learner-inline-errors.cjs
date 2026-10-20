#!/usr/bin/env node
"use strict";

/**
 * Learner-only route error chrome. Do not modify shared GracefulErrorBoundary.
 * Audit: docs/audit/ux/clone-learner-portal.md
 * Default is dry-run; --apply rewrites the explicitly owned route files.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "../..");
const files = [
  "src/app/(authenticated)/learn/error.tsx",
  "src/app/(authenticated)/learn/placements/error.tsx",
  "src/app/(authenticated)/learn/profile/academic-record/error.tsx",
  "src/app/(authenticated)/learn/my-placements/jobs/error.tsx",
  "src/app/(authenticated)/learn/my-placements/schedule/error.tsx",
];
const before = "return <GracefulErrorBoundary error={error} reset={reset} />;";
const after = 'return <GracefulErrorBoundary error={error} reset={reset} insideShell homeHref="/learn" />;';
const apply = process.argv.includes("--apply");

let changed = 0;
for (const filename of files) {
  const full = path.join(projectRoot, filename);
  const original = fs.readFileSync(full, "utf8");
  const found = original.split(before).length - 1;
  if (found !== 1) {
    throw new Error(filename + ": expected exactly one error boundary without the shell flag; found " + found);
  }
  const updated = original.replace(before, after);
  const parsed = ts.createSourceFile(filename, updated, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (parsed.parseDiagnostics.length) {
    throw new Error(filename + ": TSX parser reported " + parsed.parseDiagnostics.length + " diagnostics");
  }
  if (apply) fs.writeFileSync(full, updated, "utf8");
  console.log((apply ? "UPDATED " : "DRY-RUN ") + filename);
  changed++;
}
console.log(changed + " explicitly owned learner route fallbacks; shared files unchanged.");
