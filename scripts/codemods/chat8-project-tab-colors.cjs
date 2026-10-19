#!/usr/bin/env node
"use strict";

/**
 * chat-8 project tab legacy teal adapter.
 * Reference: docs/design/legacy-styles/components___common.scss:359-416,443-508.
 *
 * The shared Tabs already owns font/gap/scroll/focus/ink animation; only its
 * active/hover text token differs (#1a95a1 vs legacy #26bac7). Add the
 * project-scoped CSS module class to the four owned link-tab wrappers.
 *
 * Usage: node scripts/codemods/chat8-project-tab-colors.cjs [--apply]
 * Do not touch src/components/ui/* or src/styles/legacy-skin.css.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");
const files = [
  "src/components/projects/mentor-project-tabs.tsx",
  "src/components/projects/learner-project-tabs.tsx",
  "src/components/projects/super-admin-template-tabs.tsx",
  "src/components/projects/project-admin-nav.tsx",
];
const results = [], skipped = [];
for (const rel of files) {
  const file = path.join(ROOT, rel);
  const before = fs.readFileSync(file, "utf8");
  if (before.includes("legacy-project-tabs.module.css")) {
    skipped.push(rel + ": already migrated");
    continue;
  }
  const parsed = ts.createSourceFile(file, before, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const openings = [];
  function visit(n) {
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) &&
        n.tagName.getText(parsed) === "Tabs") openings.push(n);
    ts.forEachChild(n, visit);
  }
  visit(parsed);
  if (openings.length !== 1 || openings[0].attributes.properties.some(a =>
      ts.isJsxAttribute(a) && a.name.getText(parsed) === "className")) {
    skipped.push(rel + ": Tabs target missing or already customized");
    continue;
  }
  const node = openings[0];
  const at = node.tagName.getEnd();
  let after = before.slice(0, at) + " className={styles.legacy}" + before.slice(at);
  const imports = parsed.statements.filter(ts.isImportDeclaration);
  if (!imports.length) {
    skipped.push(rel + ": no import insertion anchor");
    continue;
  }
  const anchor = imports[imports.length - 1].getEnd();
  // Account for the offset inserted into the JSX source if the import
  // anchor is after the <Tabs opening (unusual, but preserve correctness).
  const adjusted = anchor + (anchor > at ? " className={styles.legacy}".length : 0);
  after = after.slice(0, adjusted) + '\nimport styles from "./legacy-project-tabs.module.css";' + after.slice(adjusted);
  const checked = ts.createSourceFile(file, after, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (checked.parseDiagnostics.length > parsed.parseDiagnostics.length) {
    skipped.push(rel + ": TSX parse regression; left unchanged");
    continue;
  }
  results.push(rel);
  if (APPLY) fs.writeFileSync(file, after);
}
process.stdout.write(JSON.stringify({
  apply: APPLY, changedFiles: results.length, files: results, skipped,
}, null, 2) + "\n");
