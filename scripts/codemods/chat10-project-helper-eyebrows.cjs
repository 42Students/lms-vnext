#!/usr/bin/env node
"use strict";

/**
 * Strip legacy eyebrow prefixes from the owned Projects admin/college helper
 * pages. The old LMS uses one inline title/description row, no eyebrow label
 * (docs/design/old-lms-pages.md:5).
 *
 * Read-only inventory: node scripts/codemods/chat10-project-helper-eyebrows.cjs
 * Apply:               node scripts/codemods/chat10-project-helper-eyebrows.cjs --write
 * This never touches shared UI components or learner/mentor Projects files.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const base = path.resolve(__dirname, "../../src/components/projects");
const names = [
  "project-admin-at-risk-page.tsx",
  "project-admin-audit-page.tsx",
  "project-admin-readiness-page.tsx",
  "project-admin-reassign-mentor-page.tsx",
  "project-admin-submissions-page.tsx",
  "super-admin-template-subview-page.tsx",
];
const destructuredEyebrow = new Set([
  "project-admin-at-risk-page.tsx",
  "project-admin-readiness-page.tsx",
  "project-admin-reassign-mentor-page.tsx",
  "project-admin-submissions-page.tsx",
]);
const write = process.argv.includes("--write");
let count = 0;

for (const name of names) {
  const file = path.join(base, name);
  if (!fs.existsSync(file)) throw new Error("Missing owned file: " + file);
  const original = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const replacements = [];
  function inspect(node) {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
        node.tagName.getText(source) === "PageHeader") {
      for (const attribute of node.attributes.properties) {
        if (ts.isJsxAttribute(attribute) && attribute.name.getText(source) === "eyebrow") {
          replacements.push({ start: attribute.getFullStart(), end: attribute.getEnd() });
        }
      }
    }
    ts.forEachChild(node, inspect);
  }
  inspect(source);
  if (!replacements.length) continue;
  let next = replacements.sort((a, b) => b.start - a.start)
    .reduce((text, part) => text.slice(0, part.start) + text.slice(part.end), original);
  if (destructuredEyebrow.has(name)) {
    // All uses of this function parameter were the removed PageHeader attributes;
    // retain the typed public prop to avoid breaking existing callers.
    const binding = /^[ \t]*eyebrow,[ \t]*\r?\n/gm;
    const found = Array.from(next.matchAll(binding));
    if (found.length !== 1) throw new Error("Unexpected eyebrow binding count: " + file);
    next = next.replace(binding, "");
  }
  const parsed = ts.createSourceFile(file, next, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (parsed.parseDiagnostics.length > source.parseDiagnostics.length) {
    throw new Error("Refusing JSX parse regression: " + file);
  }
  console.log((write ? "Updated " : "Would update ") + name + ": " + replacements.length + " PageHeader(s)");
  if (write) fs.writeFileSync(file, next, "utf8");
  count++;
}
console.log(count + " owned Projects helper file(s), " + (write ? "written" : "report only"));
