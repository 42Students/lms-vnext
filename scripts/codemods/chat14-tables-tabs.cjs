#!/usr/bin/env node
"use strict";

/**
 * chat-14 E1-E4 source codemod.
 *
 * node scripts/codemods/chat14-tables-tabs.cjs
 * node scripts/codemods/chat14-tables-tabs.cjs --apply [--only=table|chip|toggle]
 *
 * Table, display-chip and pressed-toggle conversions are AST-backed.
 * Stateful tablists and pagination links require manual integration to
 * preserve routing, selection, focus and URL behavior; those are inventoried.
 * Never mutate shared src/components/ui primitives from this script.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.join(process.cwd(), "src");
const apply = process.argv.includes("--apply");
const only = (process.argv.find(arg => arg.startsWith("--only=")) || "").slice(7);
if (only && !["table", "chip", "toggle"].includes(only)) {
  process.stderr.write("Expected --only=table, --only=chip or --only=toggle\n");
  process.exit(2);
}
const stats = {
  scanned: 0, changed: 0, table: 0, chip: 0, toggle: 0,
  pendingTabs: 0, pendingPagination: 0, pendingChip: 0, pendingToggle: 0, skipped: {},
  candidates: [],
};
const bump = name => { stats.skipped[name] = (stats.skipped[name] || 0) + 1; };
const JSX_KIND = ts.ScriptKind.TSX;
function collect(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === path.join(root, "components", "ui")) continue;
      collect(full, files);
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}
function stringAttr(tag, name) {
  const attr = tag.attributes.properties.find(p =>
    ts.isJsxAttribute(p) && p.name.getText() === name);
  return attr && attr.initializer && ts.isStringLiteral(attr.initializer)
    ? attr.initializer.text : null;
}
function hasAttr(tag, name) {
  return tag.attributes.properties.some(p =>
    ts.isJsxAttribute(p) && p.name.getText() === name);
}
function tagName(tag) { return tag.tagName.getText(); }
function ancestorTag(node, names) {
  let parent = node.parent;
  while (parent) {
    if (ts.isJsxElement(parent) && names.includes(tagName(parent.openingElement))) return true;
    parent = parent.parent;
  }
  return false;
}
function importExists(source, name, from) {
  return source.statements.some(stmt => {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier) ||
        stmt.moduleSpecifier.text !== from) return false;
    const clause = stmt.importClause;
    return Boolean(clause && clause.namedBindings &&
      ts.isNamedImports(clause.namedBindings) &&
      clause.namedBindings.elements.some(el => el.name.text === name));
  });
}
function conflictingImport(source, name, from) {
  return source.statements.some(stmt =>
    ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier) &&
    stmt.moduleSpecifier.text !== from && stmt.importClause &&
    stmt.importClause.namedBindings && ts.isNamedImports(stmt.importClause.namedBindings) &&
    stmt.importClause.namedBindings.elements.some(el => el.name.text === name));
}
function insertionPoint(source) {
  const imports = source.statements.filter(ts.isImportDeclaration);
  if (imports.length) return imports[imports.length - 1].getEnd();
  // Client components with no imports must retain their leading directive.
  const first = source.statements[0];
  if (first && ts.isExpressionStatement(first) &&
      ts.isStringLiteral(first.expression) &&
      first.expression.text === "use client") return first.getEnd();
  return 0;
}
const KEEP = /^(?:-?m[trblxy]?-(?:\S+)|w-(?:\S+)|max-w-(?:\S+)|min-w-(?:\S+)|shrink(?:-\S+)?|grow(?:-\S+)?|self-\S+|align-\S+|truncate|whitespace-\S+|sr-only)$/;
const tones = [
  [/^(?:red|rose|error)/, "error"],
  [/^(?:yellow|amber|orange|warning)/, "warning"],
  [/^(?:green|emerald|success)/, "success"],
  [/^(?:blue|sky|teal|cyan|info|primary)/, "info"],
  [/^(?:gray|grey|slate|neutral|zinc|muted)/, "neutral"],
];
function chipTone(className) {
  const semantic = className.match(/(?:bg|text)-\[var\(--lms-(success|warning|error|primary|info|neutral)[a-z-]*\)\]/);
  if (semantic) return semantic[1] === "primary" ? "info" : semantic[1];
  const match = className.match(/(?:^|\s)bg-([a-z]+)/);
  if (!match) return null;
  return tones.find(([pattern]) => pattern.test(match[1]))?.[1] || null;
}
function isDisplayChip(cls,open) {
  if (!cls || !cls.split(/\s+/).includes("rounded-full")) return false;
  if (!/(?:^|\s)(?:text-xs|text-sm|text-\[12px\]|text-\[11px\])(?:\s|$)/.test(cls)) return false;
  if (!/(?:bg-|border-)/.test(cls)) return false;
  if (/(?:^|\s)(?:absolute|fixed|sr-only|h-[0-9]|w-[0-9]|size-|rounded-full.*animate-spin)(?:\s|$)/.test(cls)) return false;
  if (open.attributes.properties.some(p => ts.isJsxSpreadAttribute(p))) return false;
  return !["onClick","onKeyDown","role","style","ref","dangerouslySetInnerHTML"].some(k=>hasAttr(open,k));
}
function safeChipClasses(cls) {
  return cls.split(/\s+/).filter(token => KEEP.test(token.split(":").pop()));
}
function lineAt(source, pos) {
  return source.getLineAndCharacterOfPosition(pos).line + 1;
}
for (const file of collect(root)) {
  const original = fs.readFileSync(file, "utf8");
  if (!/<(?:table|span|nav|div|button|Button)[\s>]/.test(original)) continue;
  stats.scanned++;
  const source = ts.createSourceFile(file, original, ts.ScriptTarget.Latest, true, JSX_KIND);
  if (source.parseDiagnostics.length) {
    bump("parse-diagnostics");
    continue;
  }
  const edits = [];
  const needs = new Set();
  const relative = path.relative(process.cwd(), file).replace(/\\/g, "/");
  function rename(element, to) {
    edits.push([element.openingElement.tagName.getStart(source),
      element.openingElement.tagName.getEnd(), to]);
    edits.push([element.closingElement.tagName.getStart(source),
      element.closingElement.tagName.getEnd(), to]);
  }
  function visit(node) {
    if (ts.isJsxElement(node)) {
      const open = node.openingElement;
      const name = tagName(open);
      if (name === "div" && stringAttr(open, "role") === "tablist") {
        stats.pendingTabs++;
        stats.candidates.push(relative + ":" + lineAt(source, node.getStart()) + " tablist:manual");
      }
      if (name === "nav" && /pages|pagination/i.test(stringAttr(open, "aria-label") || "")) {
        stats.pendingPagination++;
        stats.candidates.push(relative + ":" + lineAt(source, node.getStart()) + " pagination:manual");
      }
      if (name === "table" && (!only || only === "table")) {
        // A nested table, existing scroll container or layout table is not
        // safe to wrap in the shared Table/ScrollCue component.
        if (hasAttr(open, "ref") || stringAttr(open, "role") === "presentation" ||
            ancestorTag(node, ["table", "Table", "DataTable", "ScrollCue", "p", "svg"]) ||
            conflictingImport(source, "Table", "@/components/ui/table")) {
          bump("table:semantic-or-import-conflict");
        } else {
          rename(node, "Table");
          needs.add("Table");
          stats.table++;
          stats.candidates.push(relative + ":" + lineAt(source, node.getStart()) + " table");
        }
      }
      if (name === "span" && (!only || only === "chip")) {
        const classes = stringAttr(open,"className");
        if (classes && classes.split(/\s+/).includes("rounded-full")) {
          const tone = chipTone(classes);
          if (!isDisplayChip(classes,open) || !tone ||
              conflictingImport(source,"Badge","@/components/ui/badge")) {
            stats.pendingChip++;
            stats.candidates.push(relative+":"+lineAt(source,node.getStart())+" chip:manual");
          } else {
            rename(node,"Badge");
            const attr=open.attributes.properties.find(p=>
              ts.isJsxAttribute(p)&&p.name.getText()==="className");
            const kept=safeChipClasses(classes);
            edits.push([attr.getStart(source),attr.getEnd(),
              kept.length?'className="'+kept.join(" ")+'"':""]);
            edits.push([open.tagName.getEnd(),open.tagName.getEnd(),' tone="'+tone+'"']);
            needs.add("Badge");
            stats.chip++;
            stats.candidates.push(relative+":"+lineAt(source,node.getStart())+" chip");
          }
        }
      }
      if ((name==="button"||name==="Button")&&(!only||only==="toggle")&&hasAttr(open,"aria-pressed")) {
        const classes=stringAttr(open,"className");
        const isTab=hasAttr(open,"role")||Boolean(classes&&/border-b-2|border-b-\[/.test(classes));
        if(isTab){
          stats.pendingTabs++;
          stats.candidates.push(relative+":"+lineAt(source,node.getStart())+" tab-toggle:manual");
        } else if(!classes||!classes.includes("rounded-full")||
          open.attributes.properties.some(p=>ts.isJsxSpreadAttribute(p))||
          conflictingImport(source,"FilterChip","@/components/ui/filter-chip")){
          stats.pendingToggle++;
          stats.candidates.push(relative+":"+lineAt(source,node.getStart())+" pressed-toggle:manual");
        } else {
          rename(node,"FilterChip");
          const attr=open.attributes.properties.find(p=>
            ts.isJsxAttribute(p)&&p.name.getText()==="className");
          const kept=safeChipClasses(classes);
          edits.push([attr.getStart(source),attr.getEnd(),
            kept.length?'className="'+kept.join(" ")+'"':""]);
          const variantAttr=open.attributes.properties.find(p=>
            ts.isJsxAttribute(p)&&p.name.getText()==="variant");
          const sizeAttr=open.attributes.properties.find(p=>
            ts.isJsxAttribute(p)&&p.name.getText()==="size");
          if(variantAttr)edits.push([variantAttr.getStart(source),variantAttr.getEnd(),""]);
          if(sizeAttr)edits.push([sizeAttr.getStart(source),sizeAttr.getEnd(),""]);
          needs.add("FilterChip");
          stats.toggle++;
          stats.candidates.push(relative+":"+lineAt(source,node.getStart())+" pressed-toggle");
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!edits.length) continue;
  if (needs.has("Table") && !importExists(source, "Table", "@/components/ui/table")) {
    const point = insertionPoint(source);
    edits.push([point, point, '\nimport {Table} from "@/components/ui/table";']);
  }
  if (needs.has("Badge") && !importExists(source, "Badge", "@/components/ui/badge")) {
    const point = insertionPoint(source);
    edits.push([point, point, '\nimport {Badge} from "@/components/ui/badge";']);
  }
  if (needs.has("FilterChip") && !importExists(source,"FilterChip","@/components/ui/filter-chip")) {
    const point=insertionPoint(source);
    edits.push([point,point,'\nimport {FilterChip} from "@/components/ui/filter-chip";']);
  }
  let output = original;
  // Insertions at the same offset are intentionally both retained.
  edits.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  for (const [start, end, replacement] of edits) {
    output = output.slice(0, start) + replacement + output.slice(end);
  }
  const after = ts.createSourceFile(file, output, ts.ScriptTarget.Latest, true, JSX_KIND);
  if (after.parseDiagnostics.length) {
    bump("generated-syntax-invalid");
    continue;
  }
  stats.changed++;
  if (apply) fs.writeFileSync(file, output);
}
console.log(JSON.stringify({ dryRun: !apply, ...stats }, null, 2));
