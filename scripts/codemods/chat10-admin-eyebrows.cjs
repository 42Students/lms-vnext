#!/usr/bin/env node
"use strict";

/**
 * chat-10: remove legacy eyebrow prefixes from PageHeader calls only in the
 * owned Super Admin last-third and college Projects pages.
 *
 * Legacy proof: docs/design/old-lms-pages.md:5 describes one title plus inline
 * subtitle (no eyebrow). The shared PageHeader intentionally combines eyebrow
 * and description (src/components/ui/page-header.tsx:18-23).
 *
 * Run (read-only report): node scripts/codemods/chat10-admin-eyebrows.cjs
 * Run (apply):            node scripts/codemods/chat10-admin-eyebrows.cjs --write
 * This script does NOT run a typecheck or any tests.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const repo = path.resolve(__dirname, "../..");
const admin = path.join(repo, "src/app/(authenticated)/admin");
const paths = [
  ...["placements", "projects", "recruiters", "settings", "students", "tenants", "verification", "videos"]
    .map((name) => path.join(admin, name)),
  path.join(repo, "src/app/(authenticated)/college/projects"),
];
const write = process.argv.includes("--write");
const results = [];

function collect(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? collect(file) : (entry.isFile() && file.endsWith(".tsx") ? [file] : []);
    });
}

function updatePageHeader(file) {
  const original = fs.readFileSync(file, "utf8");
  if (!/from\s*["']@\/components\/ui\/page-header["']/.test(original) || !original.includes("eyebrow=")) return;
  const source = ts.createSourceFile(file, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  function visit(node) {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        node.tagName.getText(source) === "PageHeader") {
      for (const property of node.attributes.properties) {
        if (ts.isJsxAttribute(property) && property.name.getText(source) === "eyebrow") {
          edits.push({ start: property.getFullStart(), end: property.getEnd() });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!edits.length) return;
  const modified = edits.sort((a, b) => b.start - a.start)
    .reduce((acc, edit) => acc.slice(0, edit.start) + acc.slice(edit.end), original);
  const result = ts.createSourceFile(file, modified, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (result.parseDiagnostics.length > source.parseDiagnostics.length) {
    throw new Error("Refusing to introduce JSX parse errors in " + path.relative(repo, file));
  }
  results.push(path.relative(repo, file) + ": " + edits.length + " eyebrow attribute(s)");
  if (write) fs.writeFileSync(file, modified, "utf8");
}

for (const file of paths.flatMap(collect)) updatePageHeader(file);
console.log((write ? "Updated " : "Would update ") + results.length + " owned page files.");
for (const result of results) console.log(result);
