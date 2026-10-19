#!/usr/bin/env node
"use strict";

/**
 * Overlay codemod for the old-LMS UI clone.
 *
 * Usage:
 *   node scripts/codemods/chat16-overlays.cjs
 *   node scripts/codemods/chat16-overlays.cjs --apply
 *   node scripts/codemods/chat16-overlays.cjs --apply --only=src/components/example.tsx
 *
 * Dry-run by default. Converts only the independently verifiable pattern:
 *   {open && <div className="fixed inset-0 ...">
 *     <button className="absolute inset-0 ..." onClick={() => setOpen(false)} />
 *     <section role="dialog" aria-modal="true" aria-label="Edit"
 *       className="max-w-lg ..."><h2>Edit</h2> ...body... </section>
 *   </div>}
 * into an always-mounted shared Dialog or side Drawer.
 *
 * Drawer identification requires exactly one left-0/right-0 side and a full-height\n * panel. The AST is used for EVERY opening and closing tag. We replace the entire
 * conditional expression and entire outer wrapper, never only the opening
 * element, to avoid leaving behind an orphan </section></div>.
 *
 * Deliberately NOT converted:
 * - nonmodal popovers (aria-modal="false"), drawers, dynamic titles/close flows,
 *   markup with additional siblings or onClick/keyboard logic on the wrapper
 * - shared Dialog/Drawer/Popover, CSS selector strings or aria-hidden watermarks
 * - conditional forms with external submit buttons, state-dependent footer,
 *   focus traps or custom navigation history needing a human ownership decision
 *
 * See scripts/codemods/controls.cjs for the project's dry-run/apply conventions.
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const root = path.join(process.cwd(), "src");
const apply = process.argv.includes("--apply");
const only = (process.argv.find((arg) => arg.startsWith("--only=")) || "").slice(7).replace(/\\/g, "/");
const stats = { scanned: 0, candidates: 0, converted: 0, filesChanged: 0, skipped: {}, changes: [], errors: [] };
const count = (reason) => { stats.skipped[reason] = (stats.skipped[reason] || 0) + 1; };
const ident = (node) => node && ts.isIdentifier(node) ? node.text : null;

function filesIn(dir, out = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (absolute.replace(/\\/g, "/").endsWith("/src/components/ui")) continue;
      filesIn(absolute, out);
    } else if (item.name.endsWith(".tsx")) out.push(absolute);
  }
  return out;
}

function attribute(open, name) {
  return open.attributes.properties.find((item) =>
    ts.isJsxAttribute(item) && item.name.getText() === name);
}
function literal(open, name) {
  const item = attribute(open, name);
  if (!item || !item.initializer) return null;
  if (ts.isStringLiteral(item.initializer)) return item.initializer.text;
  return null;
}
function booleanTrue(open, name) {
  const item = attribute(open, name);
  return !!item && !!item.initializer &&
    (ts.isStringLiteral(item.initializer) && item.initializer.text === "true" ||
     ts.isJsxExpression(item.initializer) && item.initializer.expression?.kind === ts.SyntaxKind.TrueKeyword);
}
function tagName(open) { return open.tagName.getText(); }
function meaningful(children) {
  return children.filter((child) => !ts.isJsxText(child) || !!child.getText().trim());
}
function unwrap(expression) {
  while (expression && ts.isParenthesizedExpression(expression)) expression = expression.expression;
  return expression;
}
function closeSetter(backdrop) {
  const attr = attribute(backdrop.openingElement || backdrop, "onClick");
  if (!attr || !attr.initializer || !ts.isJsxExpression(attr.initializer)) return null;
  const arrow = attr.initializer.expression;
  if (!arrow || !ts.isArrowFunction(arrow)) return null;
  let body = arrow.body;
  if (ts.isBlock(body)) {
    if (body.statements.length !== 1 || !ts.isExpressionStatement(body.statements[0])) return null;
    body = body.statements[0].expression;
  }
  if (!ts.isCallExpression(body) || body.arguments.length !== 1 ||
      body.arguments[0].kind !== ts.SyntaxKind.FalseKeyword) return null;
  const setter = ident(body.expression);
  return setter && /^set[A-Z][A-Za-z0-9_$]*$/.test(setter) ? setter : null;
}
function isBackdrop(node) {
  if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node)) return false;
  const open = node.openingElement || node;
  if (!["button", "div"].includes(tagName(open))) return false;
  if (ts.isJsxElement(node) && meaningful(node.children).length) return false;
  const classes = literal(open, "className");
  if (!classes || !/(?:^|\s)(?:absolute|fixed)(?:\s|$)/.test(classes) ||
      !/(?:^|\s)inset-0(?:\s|$)/.test(classes)) return false;
  const allowed = new Set(["className", "onClick", "type", "aria-label", "aria-hidden", "tabIndex"]);
  if (open.attributes.properties.some((a) => !ts.isJsxAttribute(a) || !allowed.has(a.name.getText()))) return false;
  return !!closeSetter(node);
}
function headingTitle(node) {
  if (!ts.isJsxElement(node) || tagName(node.openingElement) !== "h2") return null;
  if (node.openingElement.attributes.properties.length) return null;
  const children = meaningful(node.children);
  if (children.length !== 1 || !ts.isJsxText(children[0])) return null;
  return children[0].getText().trim();
}
function eligible(outer, condition, source, sf) {
  if (!ts.isJsxElement(outer) || tagName(outer.openingElement) !== "div") return { skip: "not-overlay-wrapper" };
  const classes = literal(outer.openingElement, "className");
  if (!classes || !/(?:^|\s)fixed(?:\s|$)/.test(classes) ||
      !/(?:^|\s)inset-0(?:\s|$)/.test(classes)) return { skip: "not-fixed-inset-overlay" };
  if (outer.openingElement.attributes.properties.length !== 1) return { skip: "wrapper-has-behavior" };
  const nodes = meaningful(outer.children);
  if (nodes.length !== 2) return { skip: "unexpected-overlay-children" };
  const backdrop = nodes.find(isBackdrop);
  const panel = nodes.find((node) =>
    ts.isJsxElement(node) && ["div", "section"].includes(tagName(node.openingElement)) &&
    ["dialog", "alertdialog"].includes(literal(node.openingElement, "role")));
  if (!backdrop || !panel || backdrop === panel) return { skip: "unknown-backdrop-or-panel" };
  const setter = closeSetter(backdrop);
  if (!condition || !ts.isIdentifier(condition) || !setter) return { skip: "nonliteral-open-or-close-handler" };
  const expected = "set" + condition.text[0].toUpperCase() + condition.text.slice(1);
  if (setter !== expected) return { skip: "state-setter-mismatch" };
  const role = literal(panel.openingElement, "role");
  if (!booleanTrue(panel.openingElement, "aria-modal")) return { skip: "not-modal" };
  const allowed = new Set(["role", "aria-modal", "aria-label", "className"]);
  if (panel.openingElement.attributes.properties.some((a) =>
    !ts.isJsxAttribute(a) || !allowed.has(a.name.getText()))) return { skip: "panel-has-custom-handlers" };
  const title = literal(panel.openingElement, "aria-label");
  if (!title || title.includes("\n")) return { skip: "dynamic-title" };
  const children = meaningful(panel.children);
  if (!children.length || headingTitle(children[0]) !== title) return { skip: "title-or-heading-mismatch" };
  const panelClasses = literal(panel.openingElement, "className") || "";
  if (attribute(panel.openingElement, "className") && !literal(panel.openingElement, "className"))
    return { skip: "dynamic-panel-classes" };
  const maxWidth = panelClasses.split(/\s+/).find((name) => /^max-w-[a-zA-Z0-9[\]_.-]+$/.test(name));
  const bodyStart = panel.openingElement.getEnd();
  const bodyEnd = panel.closingElement.getStart(sf);
  const heading = children[0];
  const body = source.slice(bodyStart, heading.getStart(sf)) +
    source.slice(heading.getEnd(), bodyEnd);
  const left = /(?:^|\s)left-0(?:\s|$)/.test(panelClasses);
  const right = /(?:^|\s)right-0(?:\s|$)/.test(panelClasses);
  const fullHeight = /(?:^|\s)(?:h-full|inset-y-0)(?:\s|$)/.test(panelClasses);
  const kind = fullHeight && left !== right ? "Drawer" : "Dialog";
  if (kind === "Drawer" && role === "alertdialog") return { skip: "alertdialog-is-not-a-drawer" };
  return {
    kind,
    replacement: "<" + kind + " open={" + condition.text + "} onOpenChange={" + setter + "}" +
      " title=" + JSON.stringify(title) +
      (role === "alertdialog" ? ' role="alertdialog"' : "") +
      (kind === "Drawer" ? ' side="' + (left ? "left" : "right") + '"' : "") +
      (maxWidth ? " className=" + JSON.stringify(maxWidth) : "") + ">" +
      body + "</" + kind + ">",
  };
}
function importPosition(sf, source) {
  const imports = sf.statements.filter(ts.isImportDeclaration);
  if (imports.length) return imports[imports.length - 1].getEnd();
  const useClient = /^\s*["']use client["'];?/.exec(source);
  return useClient ? useClient[0].length : 0;
}
for (const file of filesIn(root)) {
  const relative = path.relative(process.cwd(), file).replace(/\\/g, "/");
  if (only && relative !== only) continue;
  stats.scanned++;
  const source = fs.readFileSync(file, "utf8");
  if (!/fixed\s+inset-0|role=["'](?:alert)?dialog["']|aria-modal/.test(source)) continue;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (sf.parseDiagnostics.length) { stats.errors.push(relative + ": source has JSX syntax diagnostics"); continue; }
  if (/\b(?:const|function|class)\s+Dialog\b/.test(source) &&
      !/from\s*["']@\/components\/ui\/dialog["']/.test(source)) {
    stats.errors.push(relative + ": local Dialog name collision"); continue;
  }
  const edits = [];
  function visit(node) {
    if (ts.isJsxExpression(node) && node.expression) {
      const expression = unwrap(node.expression);
      if (ts.isBinaryExpression(expression) &&
          expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
        const overlay = unwrap(expression.right);
        if (ts.isJsxElement(overlay) && literal(overlay.openingElement, "className")?.includes("fixed inset-0")) {
          stats.candidates++;
          const result = eligible(overlay, unwrap(expression.left), source, sf);
          if (result.replacement) {
            edits.push({ start: expression.getStart(sf), end: expression.getEnd(), value: result.replacement, kind: result.kind });
          } else count(result.skip);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  if (!edits.length) continue;
  const names = [...new Set(edits.map((edit) => edit.kind))].filter(Boolean);
  const missing = names.filter((name) => {
    const moduleName = name.toLowerCase();
    return !new RegExp('import\\s*\\{[^}]*\\b' + name + '\\b[^}]*\\}\\s*from\\s*["\\\']@/components/ui/' + moduleName + '["\\\']').test(source);
  });
  if (missing.length) {
    const pos = importPosition(sf, source);
    edits.push({ start: pos, end: pos,
      value: missing.map((name) => '\nimport { ' + name + ' } from "@/components/ui/' + name.toLowerCase() + '";').join("") });
  }
  edits.sort((a, b) => b.start - a.start);
  let updated = source;
  for (const edit of edits)
    updated = updated.slice(0, edit.start) + edit.value + updated.slice(edit.end);
  const parsed = ts.createSourceFile(file, updated, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (parsed.parseDiagnostics.length ||
      ["Dialog", "Drawer"].some((name) => {
        const opens = updated.match(new RegExp("<" + name + "\\b", "g")) || [];
        const closes = updated.match(new RegExp("</" + name + ">", "g")) || [];
        return opens.length < closes.length;
      })) {
    stats.errors.push(relative + ": generated TSX failed parsing/tag structural guard");
    continue;
  }
  stats.filesChanged++;
  stats.converted += edits.filter((edit) => !!edit.kind).length;
  stats.changes.push(relative);
  if (apply) fs.writeFileSync(file, updated, "utf8");
}
console.log(JSON.stringify({ apply, only: only || null, ...stats }, null, 2));
if (stats.errors.length) process.exitCode = 1;
