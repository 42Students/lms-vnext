#!/usr/bin/env node
"use strict";

/**
 * chat-8: align selected high-touch project action Buttons with the measured
 * 14px/650/36px default shell control (old-lms-shell-spec.md:22-24).
 *
 * These three controls previously opted into size="sm" (13px and narrower
 * horizontal padding). Only the selected project workspace actions change.
 * Disabled, variant, hover, click, type and other attributes are untouched.
 *
 * Usage: node scripts/codemods/chat8-project-control-font-size.cjs [--apply]
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const APPLY = process.argv.includes("--apply");
const targets = [
  "src/components/projects/mentor-task-status-transition.tsx",
  "src/components/projects/project-task-assignee-control.tsx",
  "src/components/projects/project-delivery-evidence-download.tsx",
];
const changed = [], skipped = [];
for (const rel of targets) {
  const file = path.join(process.cwd(), rel);
  const before = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, before, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  function visit(node) {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        node.tagName.getText(sf) === "Button") {
      for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr) || attr.name.getText(sf) !== "size" ||
            !attr.initializer || !ts.isStringLiteral(attr.initializer) ||
            attr.initializer.text !== "sm") continue;
        const start = attr.getStart(sf), end = attr.getEnd();
        // Preserve surrounding JSX whitespace. Deleting just this attribute
        // leaves the default shared Button size.
        edits.push({ start, end });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  if (!edits.length) { skipped.push(rel + ": no size=sm Button"); continue; }
  let after = before;
  for (const { start, end } of edits.sort((a, b) => b.start - a.start)) {
    after = after.slice(0, start) + after.slice(end);
  }
  const parsed = ts.createSourceFile(file, after, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (parsed.parseDiagnostics.length > sf.parseDiagnostics.length) {
    skipped.push(rel + ": parse regression, skipped");
    continue;
  }
  changed.push({ file: rel, buttons: edits.length });
  if (APPLY) fs.writeFileSync(file, after);
}
process.stdout.write(JSON.stringify({ apply: APPLY, changed, skipped }, null, 2) + "\n");
