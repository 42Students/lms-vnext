#!/usr/bin/env node
"use strict";

/**
 * chat-8: align page-heading LINK action hit areas with the old LMS.
 *
 * Legacy desktop action height: 36px (docs/design/old-lms-shell-spec.md:22-24).
 * Legacy phone breakpoint: <=767px with 44px touch inputs/controls
 * (docs/design/legacy-styles/components___listing-page-header.scss:130-159).
 *
 * Only Link elements directly inside PageHeader's actions JSX subtree and
 * already carrying min-h-11 are considered. Keep 44px on phones and switch
 * to 36px from md (768px). The shared Button/Link components aren't edited.
 *
 * Usage: node scripts/codemods/chat8-heading-action-heights.cjs [--apply]
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

const changes = [], skipped = [];
for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  if (!before.includes("<PageHeader") || !before.includes("min-h-11")) continue;
  const sf = ts.createSourceFile(file, before, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  function visit(node) {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
        node.tagName.getText(sf) === "PageHeader") {
      const actions = node.attributes.properties.find(a =>
        ts.isJsxAttribute(a) && a.name.getText(sf) === "actions");
      if (actions && ts.isJsxAttribute(actions) && actions.initializer &&
          ts.isJsxExpression(actions.initializer) && actions.initializer.expression) {
        const inspect = child => {
          if ((ts.isJsxOpeningElement(child) || ts.isJsxSelfClosingElement(child)) &&
              child.tagName.getText(sf) === "Link") {
            const cls = child.attributes.properties.find(a =>
              ts.isJsxAttribute(a) && a.name.getText(sf) === "className");
            if (cls && ts.isJsxAttribute(cls) && cls.initializer) {
              if (!ts.isStringLiteral(cls.initializer)) {
                skipped.push(path.relative(ROOT, file) + ":" +
                  (sf.getLineAndCharacterOfPosition(child.getStart(sf)).line + 1) +
                  " dynamic className");
              } else {
                const old = cls.initializer.text;
                if (/(?:^|\s)min-h-11(?:\s|$)/.test(old)) {
                  let next = old.replace(/(^|\s)sm:min-h-9(?=\s|$)/g, "$1md:min-h-9");
                  if (!/(?:^|\s)md:min-h-9(?:\s|$)/.test(next)) {
                    next += " md:min-h-9";
                  }
                  // A bordered link with 20px line height + 16px py + 2px
                  // border is 38px, despite a 36px minimum: clear y padding
                  // only from md to reach the measured 36px control height.
                  if (/(?:^|\s)border(?:\s|$)/.test(next) &&
                      /(?:^|\s)py-2(?:\s|$)/.test(next) &&
                      !/(?:^|\s)md:py-0(?:\s|$)/.test(next)) {
                    next += " md:py-0";
                  }
                  if (old !== next) edits.push({
                    start: cls.initializer.getStart(sf),
                    end: cls.initializer.getEnd(),
                    next: JSON.stringify(next),
                  });
                }
              }
            }
          }
          ts.forEachChild(child, inspect);
        };
        inspect(actions.initializer.expression);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  if (!edits.length) continue;
  let after = before;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    after = after.slice(0, edit.start) + edit.next + after.slice(edit.end);
  }
  const parsed = ts.createSourceFile(file, after, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (parsed.parseDiagnostics.length > sf.parseDiagnostics.length) {
    skipped.push(path.relative(ROOT, file) + ": JSX parse change; untouched");
    continue;
  }
  changes.push({ file: path.relative(ROOT, file).replace(/\\/g, "/"), actions: edits.length });
  if (APPLY) fs.writeFileSync(file, after);
}
process.stdout.write(JSON.stringify({
  apply: APPLY, filesScanned: files.length, changedFiles: changes.length,
  changes, skipped,
}, null, 2) + "\n");
