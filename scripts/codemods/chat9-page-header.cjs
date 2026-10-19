#!/usr/bin/env node
"use strict";

/**
 * chat-9 / old-LMS page anatomy migration.
 *
 * Usage:
 *   node scripts/codemods/chat9-page-header.cjs
 *   node scripts/codemods/chat9-page-header.cjs --apply
 *   node scripts/codemods/chat9-page-header.cjs --scope=app
 *   node scripts/codemods/chat9-page-header.cjs --scope=components --only=projects
 *
 * Default is DRY RUN. The script edits only authenticated TSX page trees and
 * explicitly allowed workspace component directories, never the shared UI kit.
 * It converts safe visible h1 headings into PageHeader, including string
 * expressions such as a conditional error title. It replaces a simple
 * <header><h1>title</h1><p>subtitle</p></header> as one unit.
 *
 * It deliberately DOES NOT rewrite complex headers, interactive heading
 * children, dialogs, hidden/a11y-only headings, fragments of mixed JSX,
 * unrelated sections, breadcrumbs, card layout, or public/auth pages.
 * Skipped cases are reported for human review rather than silently changed.
 * The orchestrator owns the --apply run, syntax/typechecks and merge.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const SRC = path.join(process.cwd(), "src");
const APPLY = process.argv.includes("--apply");
const VERBOSE = process.argv.includes("--verbose");
const SCOPE = (process.argv.find((arg) => arg.startsWith("--scope=")) || "").slice(8);
const ONLY = (process.argv.find((arg) => arg.startsWith("--only=")) || "").slice(7);
const IMPORT = 'import { PageHeader } from "@/components/ui/page-header";';
const COMPONENT_AREAS = [
  "activity", "admin", "announcements", "attendance", "college",
  "courses", "hr", "learn", "learner", "mentor", "messaging",
  "placements", "profile", "projects", "tpo", "verification",
];
const stats = {
  apply: APPLY,
  scope: SCOPE || "all",
  only: ONLY || null,
  filesScanned: 0,
  filesChanged: 0,
  headingsConverted: 0,
  skippedCount: 0,
  changedFiles: [],
  skipped: [],
};

function recordSkip(file, sf, node, reason) {
  const loc = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  stats.skippedCount += 1;
  stats.skipped.push({
    path: path.relative(process.cwd(), file).replace(/\\/g, "/"),
    line: loc.line + 1,
    reason,
  });
}
function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue;
      walk(full, out);
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      // Placement public links and recruiter invite landing are not authenticated page titles.
      if (full.includes(path.sep + "components" + path.sep) &&
          (entry.name.startsWith("public-") || entry.name === "recruiter-invite-landing.tsx")) continue;
      if (!ONLY || full.replace(/\\/g, "/").includes(ONLY)) out.push(full);
    }
  }
}
function isElement(node, tag) {
  return ts.isJsxElement(node) && node.openingElement.tagName.getText() === tag;
}
function attributes(node) {
  const opening = ts.isJsxElement(node) ? node.openingElement : node;
  return opening.attributes.properties;
}
function nameOf(attribute) {
  return ts.isJsxAttribute(attribute) ? attribute.name.getText() : "";
}
function safeAttrs(node, allowed) {
  return attributes(node).every((attribute) => {
    if (!ts.isJsxAttribute(attribute) || !allowed.includes(nameOf(attribute))) return false;
    if (nameOf(attribute) === "className" && attribute.initializer &&
        !ts.isStringLiteral(attribute.initializer)) return false;
    return true;
  });
}
function effectiveChildren(node, sf) {
  return node.children.filter((child) => {
    if (ts.isJsxText(child)) return Boolean(child.getText(sf).trim());
    if (ts.isJsxExpression(child) && !child.expression) return true;
    return true;
  });
}
function decodeEntity(value) {
  return value
    .replace(/&(?:apos|#39|#x27);/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}
function textLikeExpression(node) {
  if (!node) return false;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateExpression(node) || ts.isIdentifier(node) ||
      ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) return true;
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node)) {
    return textLikeExpression(node.expression);
  }
  if (ts.isConditionalExpression(node)) {
    return textLikeExpression(node.whenTrue) && textLikeExpression(node.whenFalse);
  }
  if (ts.isBinaryExpression(node)) {
    const op = node.operatorToken.kind;
    return (op === ts.SyntaxKind.PlusToken || op === ts.SyntaxKind.QuestionQuestionToken ||
      op === ts.SyntaxKind.BarBarToken) &&
      textLikeExpression(node.left) && textLikeExpression(node.right);
  }
  return false;
}
function propFromChildren(node, sf) {
  const items = effectiveChildren(node, sf);
  if (items.length !== 1) return null;
  const child = items[0];
  if (ts.isJsxText(child)) {
    const value = decodeEntity(child.getText(sf).replace(/\s+/g, " ").trim());
    return value ? "={" + JSON.stringify(value) + "}" : null;
  }
  if (ts.isJsxExpression(child) && child.expression &&
      textLikeExpression(child.expression)) {
    return "={" + child.expression.getText(sf) + "}";
  }
  return null;
}
function headingProps(h1, sf) {
  if (!safeAttrs(h1, ["className", "id"])) return null;
  const cls = attributes(h1).find((attr) => nameOf(attr) === "className");
  if (cls && cls.initializer && ts.isStringLiteral(cls.initializer) &&
      /(?:^|\s)(?:sr-only|hidden|invisible|opacity-0)(?:\s|$)/.test(cls.initializer.text)) return null;
  const title = propFromChildren(h1, sf);
  if (!title) return null;
  let id = "";
  const idAttr = attributes(h1).find((attr) => nameOf(attr) === "id");
  if (idAttr) id = " " + idAttr.getText(sf);
  return "title" + title + id;
}
function nearHeader(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (isElement(current, "header")) return current;
  }
  return null;
}
function inOverlay(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (!ts.isJsxElement(current)) continue;
    const tag = current.openingElement.tagName.getText();
    if (/^(?:Dialog|Modal|Drawer|Popover|Tooltip|AlertDialog)(?:Content|Header|Title)?$/.test(tag)) {
      return true;
    }
    if (attributes(current).some((a) =>
      nameOf(a) === "role" && a.initializer &&
      ts.isStringLiteral(a.initializer) &&
      /^(dialog|alertdialog)$/.test(a.initializer.text))) return true;
  }
  return false;
}
function simpleHeaderEdit(header, h1, sf) {
  if (!safeAttrs(header, ["className"])) return null;
  const children = effectiveChildren(header, sf);
  if (children.length < 1 || children.length > 2 || children[0] !== h1) return null;
  const props = headingProps(h1, sf);
  if (!props) return null;
  let description = "";
  if (children.length === 2) {
    const p = children[1];
    if (!isElement(p, "p") || !safeAttrs(p, ["className"])) return null;
    const content = propFromChildren(p, sf);
    if (!content) return null;
    description = " description" + content;
  }
  return [header.getStart(sf), header.getEnd(), "<PageHeader " + props + description + " />"];
}
function localNameClash(sf) {
  let clash = false;
  function find(node) {
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) ||
         ts.isVariableDeclaration(node)) && node.name &&
        ts.isIdentifier(node.name) && node.name.text === "PageHeader") clash = true;
    if (ts.isImportDeclaration(node) && node.importClause &&
        node.importClause.namedBindings &&
        ts.isNamedImports(node.importClause.namedBindings)) {
      for (const item of node.importClause.namedBindings.elements) {
        if (item.name.text === "PageHeader" &&
            node.moduleSpecifier.text !== "@/components/ui/page-header") clash = true;
      }
    }
    ts.forEachChild(node, find);
  }
  find(sf);
  return clash;
}
function alreadyImported(sf) {
  return sf.statements.some((statement) =>
    ts.isImportDeclaration(statement) &&
    statement.moduleSpecifier.text === "@/components/ui/page-header" &&
    statement.importClause && statement.importClause.namedBindings &&
    ts.isNamedImports(statement.importClause.namedBindings) &&
    statement.importClause.namedBindings.elements.some((item) =>
      item.name.text === "PageHeader" && !item.propertyName));
}
function importPosition(sf) {
  const imports = sf.statements.filter(ts.isImportDeclaration);
  if (imports.length) return imports[imports.length - 1].getEnd();
  const first = sf.statements[0];
  if (first && ts.isExpressionStatement(first) &&
      ts.isStringLiteral(first.expression) &&
      first.expression.text === "use client") return first.getEnd();
  return 0;
}
function convert(file) {
  const src = fs.readFileSync(file, "utf8");
  if (!/<h1(?:\s|>)/.test(src)) return;
  stats.filesScanned += 1;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (sf.parseDiagnostics.length || localNameClash(sf)) {
    recordSkip(file, sf, sf, "parse-error-or-PageHeader-name-clash");
    return;
  }
  const headings = [];
  (function visit(node) {
    if (isElement(node, "h1")) headings.push(node);
    ts.forEachChild(node, visit);
  })(sf);
  const edits = [];
  let converted = 0;
  for (const h1 of headings) {
    if (inOverlay(h1)) {
      recordSkip(file, sf, h1, "dialog-or-overlay-heading");
      continue;
    }
    const props = headingProps(h1, sf);
    if (!props) {
      recordSkip(file, sf, h1, "complex-content-attributes-or-nonstring-title");
      continue;
    }
    const header = nearHeader(h1);
    if (header) {
      const edit = simpleHeaderEdit(header, h1, sf);
      if (!edit) {
        recordSkip(file, sf, h1, "complex-header-needs-manual-actions-or-subtitle-port");
        continue;
      }
      if (edits.some((other) => other[0] < edit[1] && edit[0] < other[1])) {
        recordSkip(file, sf, h1, "overlapping-header-edit");
        continue;
      }
      edits.push(edit);
    } else {
      const edit = [h1.getStart(sf), h1.getEnd(), "<PageHeader " + props + " />"];
      if (edits.some((other) => other[0] < edit[1] && edit[0] < other[1])) {
        recordSkip(file, sf, h1, "overlapping-heading-edit");
        continue;
      }
      edits.push(edit);
    }
    converted += 1;
  }
  if (!edits.length) return;
  if (!alreadyImported(sf)) {
    const offset = importPosition(sf);
    edits.push([offset, offset, (offset ? "\n" : "") + IMPORT + "\n"]);
  }
  let out = src;
  for (const [start, end, value] of edits.sort((a, b) =>
    b[0] - a[0] || b[1] - a[1])) {
    out = out.slice(0, start) + value + out.slice(end);
  }
  const parsed = ts.createSourceFile(file, out, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (parsed.parseDiagnostics.length) {
    recordSkip(file, sf, sf, "generated-TSX-parse-error");
    return;
  }
  stats.filesChanged += 1;
  stats.headingsConverted += converted;
  stats.changedFiles.push({
    path: path.relative(process.cwd(), file).replace(/\\/g, "/"),
    headings: converted,
  });
  if (APPLY) fs.writeFileSync(file, out, "utf8");
}
const files = [];
if (SCOPE !== "components") walk(path.join(SRC, "app", "(authenticated)"), files);
if (SCOPE !== "app") {
  for (const area of COMPONENT_AREAS) walk(path.join(SRC, "components", area), files);
}
for (const file of [...new Set(files)].sort()) convert(file);
if (!VERBOSE) stats.skipped = stats.skipped.slice(0, 80);
console.log(JSON.stringify(stats, null, 2));
