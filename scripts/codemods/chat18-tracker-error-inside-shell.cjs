#!/usr/bin/env node
"use strict";
/**
 * [chat-18] Tracker authenticated route errors belong to the existing LMS canvas.
 * Source: docs/design/old-lms-pages.md:4-6 and ui-clone-checklist.md B5.
 * Run: node scripts/codemods/chat18-tracker-error-inside-shell.cjs --dry-run
 * Then: node scripts/codemods/chat18-tracker-error-inside-shell.cjs
 * Idempotent: exact edit only, throws if a selected file changes shape.
 */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..", "..");
const files = [
  "src/app/(authenticated)/tracker/error.tsx",
  "src/app/(authenticated)/tracker/audit-findings/error.tsx",
  "src/app/(authenticated)/tracker/audit-findings/[publicId]/error.tsx",
  "src/app/(authenticated)/tracker/issues/error.tsx",
  "src/app/(authenticated)/tracker/issues/[publicId]/error.tsx",
  "src/app/(authenticated)/tracker/logs/error.tsx",
  "src/app/(authenticated)/tracker/mine/[publicId]/error.tsx"
];
const oldView = /<GracefulErrorBoundary\s+error=\{error\}\s+reset=\{reset\}\s*\/>/g;
const newView = "<GracefulErrorBoundary error={error} reset={reset} insideShell />";
const dry = process.argv.includes("--dry-run");
let changes=0;
for (const file of files) {
  const absolute=path.join(root,file), source=fs.readFileSync(absolute,"utf8");
  const matches=[...source.matchAll(oldView)];
  if(matches.length===0 && source.includes(newView)) {
    process.stdout.write("UNCHANGED "+file+"\n");continue;
  }
  if(matches.length!==1)throw Error("Expected one tracker route boundary in "+file+", found "+matches.length);
  const updated=source.replace(oldView,newView);
  if(!dry)fs.writeFileSync(absolute,updated);
  process.stdout.write((dry?"WOULD UPDATE ":"UPDATED ")+file+"\n");
  changes++;
}
process.stdout.write("Tracker shell routes changed: "+changes+"\n");
