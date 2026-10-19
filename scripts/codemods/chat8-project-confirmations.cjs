#!/usr/bin/env node
"use strict";

/**
 * chat-8: replace native window.confirm in async project actions with the
 * shared ConfirmDialog-backed useConfirmFlow hook.
 *
 * This preserves the exact confirmation message, cancel/no-mutation flow,
 * pending guards, mutations and callbacks. It only changes files with one
 * exported function component, async inner handlers and a JSX root return.
 * Ambiguous/non-async cases are skipped and reported, never rewritten.
 *
 * Intended: sprint deletion, delivery lock, template archive/rollback,
 * workspace brief save and compact college project summary save.
 *
 * Usage:
 *   node scripts/codemods/chat8-project-confirmations.cjs
 *   node scripts/codemods/chat8-project-confirmations.cjs --apply
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");
const DIR = path.join(ROOT, "src/components/projects");
const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".tsx")) files.push(full);
  }
}
walk(DIR);

const result = [], skipped = [];
for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  if (!before.includes("window.confirm(")) continue;
  const source = ts.createSourceFile(file, before, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const components = source.statements.filter(n =>
    ts.isFunctionDeclaration(n) &&
    n.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) &&
    n.body && n.name);
  const containing = components.filter(component =>
    component.body.getText(source).includes("window.confirm("));
  const relative = path.relative(ROOT, file).replace(/\\/g, "/");
  if (containing.length !== 1) {
    skipped.push(relative + ": ambiguous exported component");
    continue;
  }
  const component = containing[0], calls = [];
  function visit(n) {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) &&
        ts.isIdentifier(n.expression.expression) &&
        n.expression.expression.text === "window" &&
        n.expression.name.text === "confirm") {
      let fn = n.parent;
      while (fn && !ts.isFunctionLike(fn)) fn = fn.parent;
      if (!fn || !fn.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) ||
          n.arguments.length !== 1) {
        skipped.push(relative + ": non-async or ambiguous confirmation");
      } else {
        calls.push(n);
      }
    }
    ts.forEachChild(n, visit);
  }
  visit(component.body);
  if (calls.length !== 1) {
    skipped.push(relative + ": expected exactly one async confirmation");
    continue;
  }
  const returns = component.body.statements.filter(ts.isReturnStatement);
  const last = returns[returns.length - 1];
  let root = last?.expression;
  while (root && ts.isParenthesizedExpression(root)) root = root.expression;
  if (!root || !ts.isJsxElement(root)) {
    skipped.push(relative + ": no unambiguous JSX root return");
    continue;
  }
  if (before.includes("useConfirmFlow(")) {
    skipped.push(relative + ": already converted");
    continue;
  }
  const oldCall = calls[0], edit = [];
  edit.push({
    start: oldCall.getStart(source), end: oldCall.getEnd(),
    value: "(await askConfirm(" + oldCall.arguments[0].getText(source) + "))",
  });
  edit.push({
    start: component.body.getStart(source) + 1,
    end: component.body.getStart(source) + 1,
    value: "\n const {askConfirm,dialog}=useConfirmFlow();",
  });
  edit.push({
    start: root.closingElement.getStart(source),
    end: root.closingElement.getStart(source),
    value: "  {dialog}\n ",
  });
  const imports = source.statements.filter(ts.isImportDeclaration);
  if (imports.length === 0) {
    skipped.push(relative + ": cannot safely place hook import");
    continue;
  }
  const end = imports[imports.length - 1].getEnd();
  edit.push({
    start: end, end,
    value: '\nimport { useConfirmFlow } from "@/components/ui/use-confirm-flow";',
  });
  let after = before;
  for (const e of edit.sort((a, b) => b.start - a.start)) {
    after = after.slice(0, e.start) + e.value + after.slice(e.end);
  }
  const parsed = ts.createSourceFile(file, after, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (parsed.parseDiagnostics.length > source.parseDiagnostics.length) {
    skipped.push(relative + ": TSX parser regression; not written");
    continue;
  }
  result.push({ file: relative, replacedConfirmations: calls.length });
  if (APPLY) fs.writeFileSync(file, after);
}
process.stdout.write(JSON.stringify({
  apply: APPLY, filesScanned: files.length,
  changedFiles: result.length, changes: result, skipped,
}, null, 2) + "\n");
