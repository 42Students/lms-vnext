#!/usr/bin/env node
"use strict";

/**
 * chat-5 F3/F4/F5 state codemod. Inspired by scripts/codemods/controls.cjs.
 *
 * Usage:
 *   node scripts/codemods/chat5-states.cjs
 *   node scripts/codemods/chat5-states.cjs --only=loading
 *   node scripts/codemods/chat5-states.cjs --only=error --apply
 *   node scripts/codemods/chat5-states.cjs --apply
 *
 * Dry-run by default. Applies ONLY narrow AST-verified patterns:
 *   - static, pulse-only authenticated loading.tsx return trees -> GracefulPageLoading
 *   - literal heading + description + optional unchanged action -> EmptyState/ErrorState
 *   - visual-only status/alert panels -> Alert (or Banner with an existing action)
 *
 * Authenticated route error.tsx and not-found.tsx are counted even if their
 * existing PageHeader/GracefulErrorBoundary/Link structure is intentionally left
 * untouched. Public/auth screens and src/components/ui are NEVER edited.
 * There is no string-wide JSX replacement, and closing tags are replaced as
 * part of a single whole-node edit, so opening/closing tag names stay paired.
 *
 * The orchestrator must run the dry-run, inspect skips/diffs, then --apply,
 * typecheck and verify responsive states; this script performs none of those.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const cwd = process.cwd();
const root = path.join(cwd, "src");
const routeRoot = path.join(root, "app", "(authenticated)");
const componentRoots = [
  path.join(root, "components", "placements"),
  path.join(root, "components", "tpo"),
];
const apply = process.argv.includes("--apply");
const onlyValue = (process.argv.find(a => a.startsWith("--only=")) || "--only=all").slice(7);
const modes = new Set(["all", "loading", "error", "not-found", "inline", "empty"]);
// Keep position/responsive-layout classes, not duplicate background/radius/colour skin.
const KEEP_LAYOUT = /^(-?m[trblxy]?-|w-|min-w-|max-w-|h-full|flex-|grow|shrink|basis-|self-|justify-self-|place-self-|col-|row-|order-|absolute|relative|fixed|sticky|top-|bottom-|left-|right-|inset-|z-|hidden$|block$|inline-block$|truncate$|whitespace-|sr-only$|space-[xy]-)/;
if (!modes.has(onlyValue)) {
  console.error("Invalid --only option: " + onlyValue);
  process.exitCode = 2;
} else {
  run();
}

function run() {
  const stats = {
    apply, only: onlyValue,
    routeFiles: { loading: 0, error: 0, "not-found": 0 },
    parsedFiles: 0, changedFiles: 0,
    converted: { loading: 0, alert: 0, banner: 0, empty: 0, error: 0 },
    skipped: {}, examples: [],
  };
  const files = [
    ...walk(routeRoot),
    ...(onlyValue === "all" || onlyValue === "inline" || onlyValue === "empty"
      ? componentRoots.flatMap(walk) : []),
  ].sort();
  for (const file of files) {
    const basename = path.basename(file);
    const routeKind = ["loading.tsx", "error.tsx", "not-found.tsx"].includes(basename)
      && file.startsWith(routeRoot + path.sep)
      ? basename.slice(0, -4) : "";
    if (routeKind) stats.routeFiles[routeKind]++;
    const targetRoute = !!routeKind && (onlyValue === "all" || onlyValue === routeKind);
    const targetInline = onlyValue === "all" || onlyValue === "inline" || onlyValue === "empty" ||
      ((onlyValue === "error" || onlyValue === "not-found") && routeKind === onlyValue);
    if (!targetRoute && !targetInline) continue;
    const src = fs.readFileSync(file, "utf8");
    if (!src.includes("animate-pulse") && !src.includes('role="status"') &&
        !src.includes('role="alert"') && !src.includes("aria-busy") &&
        !src.includes("<h2") && !src.includes("<h1")) continue;
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    stats.parsedFiles++;
    if (sf.parseDiagnostics.length) { bump(stats.skipped, "parse-diagnostics"); continue; }

    const edits = [];
    const imports = new Set();
    const existing = importedNames(sf);
    const declared = declaredNames(sf);
    const modules = {
      GracefulPageLoading: "graceful-page-loading",
      Alert: "alert", Banner: "banner", EmptyState: "empty-state", ErrorState: "error-state",
    };
    const skip = reason => bump(stats.skipped, reason);
    function requireComponent(name) {
      if (declared.has(name) && !existing.has(name)) {
        skip("name-clash:" + name);
        return false;
      }
      if (existing.has(name) && !hasNamedImportFrom(sf, name, "@/components/ui/" + modules[name])) {
        skip("import-from-another-module:" + name);
        return false;
      }
      if (!existing.has(name)) imports.add(name);
      return true;
    }
    function replace(node, replacement, category, name) {
      if (!requireComponent(name)) return false;
      edits.push([node.getStart(sf), node.getEnd(), replacement]);
      bump(stats.converted, category);
      return true;
    }

    if (routeKind === "loading" && targetRoute) {
      const fn = sf.statements.find(s => ts.isFunctionDeclaration(s) &&
        s.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword));
      const body = fn?.body;
      const statement = body?.statements.length === 1 ? body.statements[0] : null;
      const value = statement && ts.isReturnStatement(statement)
        ? unwrap(statement.expression) : null;
      const alreadyShared = /<\s*(GracefulPageLoading|PageLoading|LoadingState|Skeleton)\b/.test(src);
      if (alreadyShared) skip("loading:already-shared");
      else if (!fn || fn.parameters.length || !value || !ts.isJsxElement(value) ||
        !/animate-pulse/.test(value.getText(sf)) ||
        /<\s*(PageHeader|Link|Button|Alert|Banner|EmptyState|ErrorState)\b/.test(value.getText(sf)) ||
        /\b(onClick|onSubmit|useState|useEffect|fetch\s*\(|redirect\s*\()/.test(src) ||
        !pulseOnly(value)) {
        skip("loading:complex-or-not-pulse-only");
      } else {
        const label = literalAttribute(value.openingElement, "aria-label") ||
          findLoadingText(value) || inferLoadingLabel(file);
        replace(value,
          '<GracefulPageLoading label={' + JSON.stringify(label) + '} shape="directory" />',
          "loading", "GracefulPageLoading");
      }
    }

    if (!edits.length && targetInline) {
      function visit(node) {
        if (ts.isJsxElement(node)) {
          const tag = node.openingElement.tagName.getText(sf);
          if (!["section", "div", "aside", "p"].includes(tag)) {
            ts.forEachChild(node, visit);
            return;
          }
          const attrs = node.openingElement.attributes.properties;
          const role = literalAttribute(node.openingElement, "role");
          if (role !== "alert" && role !== "status") {
            ts.forEachChild(node, visit);
            return;
          }
          if (attrs.some(a => ts.isJsxSpreadAttribute(a)) ||
              attrs.some(a => !["role", "className", "aria-live", "aria-label"].includes(attrName(a)))) {
            skip("inline:complex-attributes");
            ts.forEachChild(node, visit);
            return;
          }
          const klass = literalAttribute(node.openingElement, "className");
          if (klass === null && hasAttribute(node.openingElement, "className")) {
            skip("inline:dynamic-class");
            ts.forEachChild(node, visit);
            return;
          }
          const children = node.children.filter(c => !ts.isJsxText(c) || c.getText(sf).trim());
          const isError = role === "alert";
          if ((onlyValue === "all" || onlyValue === "empty" ||
               onlyValue === "error" || onlyValue === "not-found") &&
              ["section", "div"].includes(tag) && children.length >= 2 && children.length <= 3) {
            const heading = children[0], description = children[1], action = children[2];
            const hTag = ts.isJsxElement(heading) ? heading.openingElement.tagName.getText(sf) : "";
            const pTag = ts.isJsxElement(description) ? description.openingElement.tagName.getText(sf) : "";
            const headText = /^h[1-3]$/.test(hTag) ? plainText(heading) : null;
            const bodyText = pTag === "p" ? plainText(description) : null;
            const actionTag = action && ts.isJsxElement(action)
              ? action.openingElement.tagName.getText(sf) : "";
            const actionOk = !action || /^(Button|Link|a)$/.test(actionTag);
            if (headText && bodyText && actionOk && !hasAttribute(node.openingElement, "aria-label") &&
                (onlyValue === "all" || (isError ? ["error", "not-found"].includes(onlyValue) :
                onlyValue === "empty"))) {
              const name = isError ? "ErrorState" : "EmptyState";
              let replacement = "<" + name + " title={" + JSON.stringify(headText) +
                "} description={" + JSON.stringify(bodyText) + "}";
              if (action) replacement += " action={" + action.getText(sf) + "}";
              replacement += " />";
              if (replace(node, replacement, isError ? "error" : "empty", name)) return;
            }
          }
          if (onlyValue !== "all" && onlyValue !== "inline") {
            ts.forEachChild(node, visit);
            return;
          }
          if (!["section", "div", "aside", "p"].includes(tag) ||
              !klass || !/\bborder\b/.test(klass) ||
              !/(?:\bbg-|\bborder-(?:amber|yellow|warning|red|rose))/.test(klass) ||
              /<(?:PageHeader|h1|h2|h3|form|input|select|table|ul|ol|nav|article|details|fieldset|textarea|dl)\b/.test(node.getText(sf))) {
            ts.forEachChild(node, visit);
            return;
          }
          const rawBody = src.slice(node.openingElement.end, node.closingElement.getStart(sf));
          if (/<(?:script|style|iframe)\b/.test(rawBody)) { skip("inline:unsafe-children"); return; }
          const text = rawBody.replace(/<[^>]*>/g, " ");
          const tone = /(bg-(?:amber|yellow|warning)|border-(?:amber|yellow|warning))/.test(klass)
            ? "warning" : /(bg-(?:red|rose|error)|border-(?:red|rose|error))/.test(klass)
              ? "error" : /(?:saved|success|complete)/i.test(text) ? "success"
                : /(pending|not ready|unavailable|blocked|cannot|limit|capped|migration)/i.test(text)
                  ? "warning" : isError ? "error" : "info";
          const layoutClasses = klass.split(/\s+/).filter(Boolean).filter(token =>
            KEEP_LAYOUT.test(token.split(":").pop()));
          const restAttrs = [
            ...attrs.filter(a => attrName(a) !== "className").map(a => a.getText(sf)),
            ...(layoutClasses.length ? ["className=" + JSON.stringify(layoutClasses.join(" "))] : []),
          ].join(" ");
          const action = children.length >= 2 ? children[children.length - 1] : null;
          const actionTag = action && ts.isJsxElement(action) ? action.openingElement.tagName.getText(sf) : "";
          const isBanner = tone === "warning" && /(bg-(?:amber|yellow|warning))/.test(klass) &&
            /^(Button|Link|a)$/.test(actionTag);
          let component = "Alert", payload = rawBody;
          let props = 'tone="' + tone + '"' + (restAttrs ? " " + restAttrs : "");
          if (isBanner) {
            component = "Banner";
            props += " action={" + action.getText(sf) + "}";
            const end = action.getEnd();
            payload = src.slice(node.openingElement.end, action.getStart(sf)) +
              src.slice(end, node.closingElement.getStart(sf));
          }
          if (replace(node, "<" + component + " " + props + ">" + payload +
              "</" + component + ">", component.toLowerCase(), component)) return;
        }
        ts.forEachChild(node, visit);
      }
      ts.forEachChild(sf, visit);
    }

    if (!edits.length) continue;
    // No overlapping source intervals; replacing a matched JSX subtree removes
    // all its original opening/closing tags together.
    edits.sort((a, b) => b[0] - a[0]);
    for (let i = 1; i < edits.length; i++) {
      if (edits[i][1] > edits[i - 1][0]) {
        throw new Error("Overlapping JSX edits in " + file);
      }
    }
    let result = src;
    for (const [start, end, text] of edits) {
      result = result.slice(0, start) + text + result.slice(end);
    }
    const lines = [...imports].map(n =>
      'import { ' + n + ' } from "@/components/ui/' + modules[n] + '";');
    if (lines.length) {
      const lastImport = sf.statements.filter(ts.isImportDeclaration).at(-1);
      const first = sf.statements[0];
      const insertion = lastImport ? lastImport.end :
        first && ts.isExpressionStatement(first) &&
        ts.isStringLiteral(first.expression) && first.expression.text === "use client"
          ? first.end : 0;
      // Existing edits are guaranteed to start after imports for the supported
      // JSX nodes, so this original-source insertion offset is still valid.
      result = result.slice(0, insertion) +
        (insertion ? "\n" : "") + lines.join("\n") + "\n" + result.slice(insertion);
    }
    // Syntax-only parsing of generated TSX, NOT a typecheck, test or app run.
    const check = ts.createSourceFile(file, result, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    if (check.parseDiagnostics.length) {
      skip("generated-jsx-parse-failed");
      // The candidate counts are diagnostic only; the file remains unchanged.
      continue;
    }
    stats.changedFiles++;
    if (stats.examples.length < 40) stats.examples.push(path.relative(cwd, file));
    if (apply) fs.writeFileSync(file, result, "utf8");
  }
  console.log(JSON.stringify(stats, null, 2));
  if (!apply) console.log("Dry-run only. Inspect candidate files and use --apply after review.");
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile() && entry.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}
function bump(target, key) { target[key] = (target[key] || 0) + 1; }
function unwrap(expr) {
  while (expr && (ts.isParenthesizedExpression(expr) || ts.isAsExpression(expr))) {
    expr = expr.expression;
  }
  return expr;
}
function attrName(a) { return ts.isJsxAttribute(a) ? a.name.getText() : ""; }
function hasAttribute(open, name) {
  return open.attributes.properties.some(a => attrName(a) === name);
}
function literalAttribute(open, name) {
  const attr = open.attributes.properties.find(a => attrName(a) === name);
  return attr?.initializer && ts.isStringLiteral(attr.initializer)
    ? attr.initializer.text : null;
}
function importedNames(sf) {
  const found = new Set();
  for (const s of sf.statements) {
    if (!ts.isImportDeclaration(s)) continue;
    const clause = s.importClause;
    if (clause?.name) found.add(clause.name.text);
    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const e of clause.namedBindings.elements) found.add(e.name.text);
    }
  }
  return found;
}
function hasNamedImportFrom(sf, name, source) {
  return sf.statements.some(s =>
    ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier) &&
    s.moduleSpecifier.text === source &&
    s.importClause?.namedBindings && ts.isNamedImports(s.importClause.namedBindings) &&
    s.importClause.namedBindings.elements.some(e => e.name.text === name)
  );
}
function declaredNames(sf) {
  const found = importedNames(sf);
  for (const s of sf.statements) {
    if (ts.isFunctionDeclaration(s) || ts.isClassDeclaration(s) ||
        ts.isInterfaceDeclaration(s) || ts.isTypeAliasDeclaration(s)) {
      if (s.name) found.add(s.name.text);
    }
    if (ts.isVariableStatement(s)) {
      for (const d of s.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) found.add(d.name.text);
      }
    }
  }
  return found;
}
function plainText(node) {
  if (!ts.isJsxElement(node)) return null;
  if (node.children.some(c => !ts.isJsxText(c))) return null;
  const raw = node.children.map(c => c.getText()).join("").replace(/\s+/g, " ").trim();
  if (!raw || /&(?:[a-z]+|#\d+);/i.test(raw)) return null;
  return raw;
}
function findLoadingText(node) {
  let label = null;
  (function scan(n) {
    if (ts.isJsxText(n)) {
      const text = n.getText().replace(/\s+/g, " ").trim();
      if (/^Loading\b/i.test(text) && text.length < 100) label ||= text;
    }
    ts.forEachChild(n, scan);
  })(node);
  return label;
}
function inferLoadingLabel(file) {
  const parent = path.basename(path.dirname(file)).replace(/\[[^\]]+\]/g, "details")
    .replace(/[-_]/g, " ");
  return "Loading " + (parent || "workspace") + "…";
}
function pulseOnly(node) {
  let pulses = 0, unsafe = false;
  (function check(n) {
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = (ts.isJsxElement(n) ? n.openingElement : n).tagName.getText();
      if (!["div", "section", "main", "span"].includes(tag)) unsafe = true;
      const open = ts.isJsxElement(n) ? n.openingElement : n;
      const attrs = open.attributes.properties;
      if (attrs.some(a => ts.isJsxSpreadAttribute(a) ||
        (ts.isJsxAttribute(a) && /^on[A-Z]/.test(attrName(a))))) unsafe = true;
      if (/\banimate-pulse\b/.test(literalAttribute(open, "className") || "")) pulses++;
    }
    if (ts.isJsxText(n) && n.getText().trim() &&
      !/^Loading\b/i.test(n.getText().trim())) unsafe = true;
    if (ts.isJsxExpression(n) && n.expression) {
      const s = n.expression.getText();
      if (!/^(?:Array\.from\s*\(|\[[^\]]+\]\.map\s*\()/.test(s)) unsafe = true;
    }
    ts.forEachChild(n, check);
  })(node);
  return !unsafe && pulses >= 2;
}
