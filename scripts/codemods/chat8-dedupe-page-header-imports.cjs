#!/usr/bin/env node
"use strict";

/**
 * chat-8: remove duplicate PageHeader import declarations introduced by
 * overlapping page-header codemods, without touching page content or JSX.
 *
 * Scope: Mentor and Tracker routes plus src/components/projects only.
 * Expected duplicate-import pages on 2026-10-19: calendar, board-review,
 * review-overview, risk-readiness, team-meetings, timeline, reports.
 *
 * Usage:
 *   node scripts/codemods/chat8-dedupe-page-header-imports.cjs
 *   node scripts/codemods/chat8-dedupe-page-header-imports.cjs --apply
 *
 * No output is written without --apply. The first import is retained exactly.
 * This deliberately does not consolidate differently shaped import clauses.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");
const DIRS = [
  "src/app/(authenticated)/mentor",
  "src/app/(authenticated)/tracker",
  "src/components/projects",
];
const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".tsx")) files.push(full);
  }
}
for (const dir of DIRS) walk(path.join(ROOT, dir));

const changes = [];
const skipped = [];
for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  if (!before.includes("@/components/ui/page-header")) continue;
  const sf = ts.createSourceFile(file, before, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const seen = new Set();
  const edits = [];
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    if (stmt.moduleSpecifier.text !== "@/components/ui/page-header") continue;
    const clause = stmt.importClause;
    if (!clause || clause.isTypeOnly || clause.name || !clause.namedBindings ||
        !ts.isNamedImports(clause.namedBindings) ||
        clause.namedBindings.elements.length !== 1) continue;
    const spec = clause.namedBindings.elements[0];
    if (spec.isTypeOnly || spec.propertyName || spec.name.text !== "PageHeader") continue;
    const key = stmt.moduleSpecifier.text + ":PageHeader";
    if (!seen.has(key)) {
      seen.add(key);
      continue;
    }
    const start = stmt.getStart(sf);
    const lineStart = before.lastIndexOf("\n", start - 1) + 1;
    if (before.slice(lineStart, start).trim()) {
      skipped.push(path.relative(ROOT, file) + ": inline import");
      continue;
    }
    let end = stmt.getEnd();
    if (before.slice(end, end + 2) === "\r\n") end += 2;
    else if (before[end] === "\n") end += 1;
    edits.push([lineStart, end]);
  }
  if (!edits.length) continue;
  let after = before;
  for (const [start, end] of edits.sort((a, b) => b[0] - a[0])) {
    after = after.slice(0, start) + after.slice(end);
  }
  const parsed = ts.createSourceFile(file, after, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (parsed.parseDiagnostics.length > sf.parseDiagnostics.length) {
    skipped.push(path.relative(ROOT, file) + ": new JSX/TS parse diagnostics; left unchanged");
    continue;
  }
  changes.push({ file: path.relative(ROOT, file).replace(/\\/g, "/"), importsRemoved: edits.length });
  if (APPLY) fs.writeFileSync(file, after);
}
process.stdout.write(JSON.stringify({
  apply: APPLY, filesScanned: files.length, changedFiles: changes.length,
  changes, skipped,
}, null, 2) + "\n");
