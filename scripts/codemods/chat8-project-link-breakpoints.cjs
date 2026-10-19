#!/usr/bin/env node
"use strict";

/**
 * chat-8: normalise standalone button-shaped Link breakpoints on owned pages.
 *
 * The old LMS uses <=767px for touch-layout styles
 * (components___listing-page-header.scss:130-159); desktop actions are 36px
 * (old-lms-shell-spec.md:22-24). React Link uses 44px until md (768px).
 *
 * This complements chat8-heading-action-heights.cjs: it handles button-shaped
 * links outside PageHeader.actions, especially project detail action rows.
 * No raw form controls or shared UI source files are changed.
 *
 * Usage: node scripts/codemods/chat8-project-link-breakpoints.cjs [--apply]
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
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile() && e.name.endsWith(".tsx")) files.push(p);
  }
}
for (const d of DIRS) walk(path.join(ROOT, d));

const changes = [];
const skips = [];
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes("min-h-11") || !src.includes("Link")) continue;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const replacements = [];
  function visit(n) {
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) &&
        n.tagName.getText(sf) === "Link") {
      const classAttr = n.attributes.properties.find(a =>
        ts.isJsxAttribute(a) && a.name.getText(sf) === "className");
      if (classAttr && ts.isJsxAttribute(classAttr) && classAttr.initializer) {
        if (!ts.isStringLiteral(classAttr.initializer)) {
          skips.push(path.relative(ROOT, file) + ":" +
            (sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1) + " dynamic class");
        } else {
          const before = classAttr.initializer.text;
          // Require existing button-like paint; do not alter underlined text links.
          if (/(?:^|\s)min-h-11(?:\s|$)/.test(before) &&
              (/(?:^|\s)rounded-\S+/.test(before)) &&
              (/(?:^|\s)border(?:\s|$)/.test(before) ||
               /(?:^|\s)bg-primary(?:\s|$)/.test(before))) {
            const after = before.replace(/(^|\s)sm:min-h-9(?=\s|$)/g, "$1md:min-h-9");
            if (before !== after) replacements.push({
              start: classAttr.initializer.getStart(sf),
              end: classAttr.initializer.getEnd(),
              value: JSON.stringify(after),
            });
          }
        }
      }
    }
    ts.forEachChild(n, visit);
  }
  visit(sf);
  if (!replacements.length) continue;
  let next = src;
  for (const r of replacements.sort((a, b) => b.start - a.start)) {
    next = next.slice(0, r.start) + r.value + next.slice(r.end);
  }
  const parsed = ts.createSourceFile(file, next, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (parsed.parseDiagnostics.length > sf.parseDiagnostics.length) {
    skips.push(path.relative(ROOT, file) + ": parse regression; not written");
    continue;
  }
  changes.push({ file: path.relative(ROOT, file).replace(/\\/g, "/"),
    links: replacements.length });
  if (APPLY) fs.writeFileSync(file, next);
}
process.stdout.write(JSON.stringify({
  apply: APPLY, filesScanned: files.length, changedFiles: changes.length,
  changes, skipped: skips,
}, null, 2) + "\n");
