// usage: node codemod-controls.cjs [--apply] [--only=button|select|input|textarea]
// Converts raw <button>/<select>/<input>/<textarea> in src (outside src/components/ui) to the shared components.
// Keeps only layout classes; drops duplicated visual classes so the shared component's old-LMS look wins.
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const ROOT = path.join(process.cwd(), "src");
const apply = process.argv.includes("--apply");
const onlyArg = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7);
const MAP = {
  button: { name: "Button", imp: 'import {Button} from "@/components/ui/button";' },
  select: { name: "Select", imp: 'import {Select} from "@/components/ui/select";' },
  input: { name: "Input", imp: 'import {Input} from "@/components/ui/input";' },
  textarea: { name: "Textarea", imp: 'import {Textarea} from "@/components/ui/textarea";' },
};
const KEEP = /^(-?m[trblxy]?-|w-|min-w-|max-w-|h-full|flex-|grow|shrink|basis-|self-|justify-self-|place-self-|col-|row-|order-|absolute|relative|fixed|sticky|top-|bottom-|left-|right-|inset-|z-|hidden|block$|inline-block|truncate|whitespace-|sr-only)/;
const stats = { converted: {}, skipped: {} };
const bump = (o, k) => (o[k] = (o[k] || 0) + 1);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (p.replace(/\\/g, "/").endsWith("src/components/ui")) continue;
      walk(p, out);
    } else if (e.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}
const attrName = (a) => (a.name && a.name.getText ? a.name.getText() : "");
function classify(tag, cls) {
  if (tag !== "button") return null;
  if (/bg-primary|button-primary|--lms-primary\)\]\s|on-primary|bg-\[var\(--lms-primary\)\]/.test(cls)) return "primary";
  if (/error|danger|red-|rose-/.test(cls)) return "danger";
  if (/\bborder\b|border-border|border-\[/.test(cls)) return "secondary";
  if (/\bbg-|bg-\[/.test(cls)) return "secondary";
  return "ghost";
}

let totalFiles = 0;
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8");
  if (!/<(button|select|input|textarea)[\s>/]/.test(src)) continue;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  const needImports = new Set();
  const localNames = new Set();
  sf.forEachChild(function find(n) {
    if ((ts.isFunctionDeclaration(n) || ts.isVariableDeclaration(n) || ts.isClassDeclaration(n)) && n.name && ts.isIdentifier(n.name)) localNames.add(n.name.text);
    ts.forEachChild(n, find);
  });
  const hasImport = (nm) => new RegExp("import[^;]*\\b" + nm + "\\b[^;]*from").test(src);
  function handle(open, close) {
    const tag = open.tagName.getText();
    if (!MAP[tag] || (onlyArg && onlyArg !== tag)) return;
    const m = MAP[tag];
    if (localNames.has(m.name) && !hasImport(m.name)) return bump(stats.skipped, tag + ":name-clash");
    const attrs = open.attributes.properties;
    if (attrs.some((a) => ts.isJsxSpreadAttribute(a))) return bump(stats.skipped, tag + ":spread");
    const get = (n) => attrs.find((a) => attrName(a) === n);
    const lit = (a) => (a && a.initializer && ts.isStringLiteral(a.initializer) ? a.initializer.text : null);
    if (tag === "input") {
      const t = lit(get("type"));
      if (get("type") && t === null) return bump(stats.skipped, "input:dynamic-type");
      if (t && /^(checkbox|radio|hidden|file|range|color|image|submit|button|reset)$/.test(t)) return bump(stats.skipped, "input:type-" + t);
    }
    const role = lit(get("role"));
    if (role && /^(tab|menuitem|option|switch|checkbox|radio|combobox|menuitemradio|menuitemcheckbox)$/.test(role)) return bump(stats.skipped, tag + ":role-" + role);
    if (get("aria-pressed") || get("aria-selected")) return bump(stats.skipped, tag + ":toggle");
    const ca = get("className");
    let cls = "";
    if (ca) {
      cls = lit(ca);
      if (cls === null) return bump(stats.skipped, tag + ":dynamic-class");
    }
    if (tag === "button" && /rounded-full|underline|border-b-2|border-b-\[|sr-only/.test(cls)) return bump(stats.skipped, "button:pill-or-tab-or-link");
    const kept = cls.split(/\s+/).filter(Boolean).filter((tok) => KEEP.test(tok.split(":").pop()));
    const variant = classify(tag, cls);
    // tag rename
    edits.push([open.tagName.getStart(), open.tagName.getEnd(), m.name]);
    if (close) edits.push([close.tagName.getStart(), close.tagName.getEnd(), m.name]);
    // className rewrite
    if (ca) {
      if (kept.length) edits.push([ca.getStart(), ca.getEnd(), 'className="' + kept.join(" ") + '"']);
      else edits.push([ca.getStart(), ca.getEnd() + (src[ca.getEnd()] === " " ? 1 : 0), ""]);
    }
    if (variant && variant !== "primary") edits.push([open.tagName.getEnd(), open.tagName.getEnd(), ' variant="' + variant + '"']);
    needImports.add(tag);
    bump(stats.converted, tag);
  }
  (function visit(n) {
    if (ts.isJsxElement(n)) handle(n.openingElement, n.closingElement);
    else if (ts.isJsxSelfClosingElement(n)) handle(n, null);
    ts.forEachChild(n, visit);
  })(sf);
  if (!edits.length) continue;
  let out = src;
  edits.sort((a, b) => b[0] - a[0]);
  for (const [s, e, t] of edits) out = out.slice(0, s) + t + out.slice(e);
  const imps = [...needImports].map((t) => MAP[t]).filter((m) => !hasImport(m.name)).map((m) => m.imp);
  if (imps.length) {
    const re = /^import[\s\S]*?;[ \t]*$/gm;
    let last = -1, mm;
    while ((mm = re.exec(out))) last = mm.index + mm[0].length;
    out = last >= 0 ? out.slice(0, last) + "\n" + imps.join("\n") + out.slice(last) : imps.join("\n") + "\n" + out;
  }
  totalFiles++;
  if (apply) fs.writeFileSync(file, out);
}
console.log(JSON.stringify({ apply, filesChanged: totalFiles, stats }, null, 1));
