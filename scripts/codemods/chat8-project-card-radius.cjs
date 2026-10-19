#!/usr/bin/env node
"use strict";

/**
 * chat-8: Replace *card surfaces*, not controls, that still inherit the
 * 9px old-LMS button/control radius. Legacy card radius is 12px:
 * docs/design/legacy-styles/components___variables.scss:133-136
 * vNext token: src/app/globals.css:815 (--lms-radius-card).
 *
 * Usage:
 *   node scripts/codemods/chat8-project-card-radius.cjs         # dry run
 *   node scripts/codemods/chat8-project-card-radius.cjs --apply # edit
 *
 * Only static className strings on bordered, padded <article> cards and
 * explicitly draggable <li> board-task cards are touched. Dynamic JSX,
 * shared UI components, controls, headings and layout are untouched.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");
const ROOTS = [
  "src/app/(authenticated)/mentor",
  "src/app/(authenticated)/tracker",
  "src/components/projects",
];
const BEFORE = "rounded-[var(--lms-control-radius)]";
const AFTER = "rounded-[var(--lms-radius-card)]";
const changes = [];
const skipped = [];

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith(".tsx")) out.push(full);
  }
}
const files = [];
for (const d of ROOTS) walk(path.join(ROOT, d), files);
for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  if (!before.includes(BEFORE)) continue;
  const source = ts.createSourceFile(file, before, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const replacements = [];
  (function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      if (tag !== "article" && tag !== "li") {
        return ts.forEachChild(node, visit);
      }
      const attrs = node.attributes.properties;
      const classAttr = attrs.find(a => ts.isJsxAttribute(a) && a.name.getText(source) === "className");
      const draggable = attrs.some(a => ts.isJsxAttribute(a) && a.name.getText(source) === "draggable");
      if (!classAttr || !ts.isJsxAttribute(classAttr) || !classAttr.initializer) {
        return ts.forEachChild(node, visit);
      }
      const init = classAttr.initializer;
      const pos = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      if (!ts.isStringLiteral(init)) {
        if (init.getText(source).includes(BEFORE)) skipped.push(rel + ":" + pos + " dynamic class");
        return ts.forEachChild(node, visit);
      }
      const cls = init.text;
      const isCard = /(?:^|\s)border(?:\s|$)/.test(cls) &&
        /(?:^|\s)p-[2345](?:\s|$)/.test(cls) &&
        (/(?:^|\s)bg-surface(?:\s|$)/.test(cls) || /(?:^|\s)bg-white(?:\s|$)/.test(cls));
      if (cls.includes(BEFORE) && isCard && (tag === "article" || draggable)) {
        replacements.push({
          start: init.getStart(source),
          end: init.getEnd(),
          value: JSON.stringify(cls.replace(BEFORE, AFTER)),
        });
        changes.push(rel + ":" + pos);
      } else if (cls.includes(BEFORE)) {
        skipped.push(rel + ":" + pos + " ambiguous surface");
      }
    }
    ts.forEachChild(node, visit);
  })(source);
  if (!replacements.length) continue;
  let after = before;
  for (const x of replacements.sort((a, b) => b.start - a.start)) {
    after = after.slice(0, x.start) + x.value + after.slice(x.end);
  }
  if (APPLY && after !== before) fs.writeFileSync(file, after);
}
process.stdout.write(JSON.stringify({ apply: APPLY, filesScanned: files.length,
  cardSurfaces: changes.length, changes, skipped }, null, 2) + "\n");
