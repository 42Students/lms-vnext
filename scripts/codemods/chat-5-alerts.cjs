/* eslint-disable no-console */
// Chat-5: convert only safe, leaf-level native ARIA error notices to the
// existing shared InlineNotice. Do not rewrite result counters, inputs,
// form labels, editable regions, or notices containing links/buttons.
// Dry run: node scripts/codemods/chat-5-alerts.cjs
// Apply:   node scripts/codemods/chat-5-alerts.cjs --apply
// Scope:   node scripts/codemods/chat-5-alerts.cjs --scope=src/components/placements --apply
//
// Uses the TSX parser (rather than replacing paired tags with regex) so both
// opening and closing tags are removed atomically. New shared imports are
// inserted after imports. This file is committed for orchestrator execution;
// chat-5 does NOT run application code, codemods, typechecks, or CI.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const apply = process.argv.includes("--apply");
const scopeArg = (process.argv.find(a => a.startsWith("--scope=")) || "--scope=src").slice(8);
const root = path.resolve(process.cwd(), scopeArg);
const sourceRoot = path.resolve(process.cwd(), "src");
if (!(root === sourceRoot || root.startsWith(sourceRoot + path.sep))) {
  throw new Error("Scope must be inside src/");
}
const counters = { filesVisited: 0, filesChanged: 0, candidates: 0, converted: 0,
  skippedComplex: 0, skippedNotString: 0, skippedParsed: 0 };
const allowedVariables = /^(?:error|errorMessage|message|failure|issue|notice|reason|validationError|generalError|formError|errorText)$/;
const importText = 'import { InlineNotice } from "@/components/ui/inline-notice";';

function collect(dir, out) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    const rel = path.relative(sourceRoot, full).replaceAll(path.sep, "/");
    if (item.isDirectory()) {
      if (rel === "components/ui" || rel.split("/").some(p => p === "__tests__")) continue;
      collect(full, out);
    } else if (item.isFile() && item.name.endsWith(".tsx") && !/\.test\.tsx$/.test(item.name)) {
      out.push(full);
    }
  }
}
const files = [];
collect(root, files);
for (const file of files) {
  counters.filesVisited++;
  const src = fs.readFileSync(file, "utf8");
  if (!/role\s*=\s*["']alert["']/.test(src)) continue;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (sf.parseDiagnostics.length) {
    counters.skippedParsed++;
    continue;
  }
  const patches = [];
  let needsImport = false;
  function visit(n) {
    if (ts.isJsxElement(n) && ["p", "span"].includes(n.openingElement.tagName.getText(sf))) {
      const attr = n.openingElement.attributes.properties;
      const role = attr.find(a => ts.isJsxAttribute(a) && a.name.text === "role");
      if (!role || !role.initializer || !ts.isStringLiteral(role.initializer) ||
          role.initializer.text !== "alert") {
        ts.forEachChild(n, visit);
        return;
      }
      counters.candidates++;
      const attrs = attr.filter(a => ts.isJsxAttribute(a));
      if (attr.length !== attrs.length ||
          attrs.some(a => !["role", "className", "aria-live", "id"].includes(a.name.text)) ||
          attrs.some(a => a.name.text === "className" &&
            a.initializer && ts.isStringLiteral(a.initializer) &&
            /\bsr-only\b/.test(a.initializer.text))) {
        counters.skippedComplex++;
        ts.forEachChild(n, visit);
        return;
      }
      const content = n.children.filter(c => !(ts.isJsxText(c) && !c.getText(sf).trim()));
      let message;
      if (content.length === 1 && ts.isJsxText(content[0])) {
        const txt = content[0].getText(sf).replace(/\s+/g, " ").trim();
        if (txt) message = JSON.stringify(txt);
      } else if (content.length === 1 && ts.isJsxExpression(content[0]) && content[0].expression) {
        const expr = content[0].expression;
        // Only simple string-valued name expressions. Complex JSX, template
        // fragments, numeric counters and null-able values need human review.
        if (ts.isIdentifier(expr) && allowedVariables.test(expr.text)) {
          message = "{" + expr.getText(sf) + "}";
        }
      }
      if (!message) {
        counters.skippedNotString++;
        ts.forEachChild(n, visit);
        return;
      }
      patches.push([n.getStart(sf), n.getEnd(), '<InlineNotice tone="error" message=' + message + ' />']);
      needsImport = true;
      counters.converted++;
      return;
    }
    ts.forEachChild(n, visit);
  }
  visit(sf);
  if (!patches.length) continue;
  if (!/import\s*\{[^}]*\bInlineNotice\b[^}]*\}\s*from\s*["']@\/components\/ui\/inline-notice["']/.test(src)) {
    const last = sf.statements.filter(ts.isImportDeclaration).at(-1);
    if (!last) {
      const directive = sf.statements.find(s => ts.isExpressionStatement(s) &&
        ts.isStringLiteral(s.expression) && s.expression.text === "use client");
      const at = directive ? directive.getEnd() : 0;
      patches.push([at, at, "\n" + importText]);
    } else {
      const at = last.getEnd();
      patches.push([at, at, "\n" + importText]);
    }
  }
  let out = src;
  patches.sort((a,b) => b[0]-a[0] || b[1]-a[1]);
  for (const [a,b,insert] of patches) out = out.slice(0,a) + insert + out.slice(b);
  if (out === src) continue;
  counters.filesChanged++;
  if (apply) fs.writeFileSync(file, out);
}
console.log(JSON.stringify({ apply, scope: path.relative(process.cwd(),root), ...counters }, null, 2));
