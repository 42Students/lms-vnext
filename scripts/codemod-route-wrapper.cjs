// One-shot converter: moves uniform API routes onto the central route() wrapper. Skips anything unusual.
// Usage: node scripts/codemod-route-wrapper.cjs [--apply] [--limit N]
const ts = require("typescript");
const fs = require("fs"), cp = require("child_process");
const APPLY = process.argv.includes("--apply");
const li = process.argv.indexOf("--limit"); const LIMIT = li > 0 ? +process.argv[li + 1] : Infinity;
const files = cp.execFileSync("git", ["ls-files", "src/app/api"], { encoding: "utf8" }).split("\n").filter((f) => f.endsWith("/route.ts"));
const skip = {}; const bump = (k) => (skip[k] = (skip[k] || 0) + 1);
let converted = 0, handlers = 0;
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const text = (src, n) => src.slice(n.getStart(), n.getEnd());

function isOriginGuard(st) {
  if (!ts.isIfStatement(st) || st.elseStatement) return false;
  const c = st.expression;
  if (!(ts.isPrefixUnaryExpression(c) && ts.isCallExpression(c.operand) && c.operand.expression.getText() === "isSameOriginRequest")) return false;
  const t = st.thenStatement.getText().replace(/\s+/g, "");
  return /INVALID_ORIGIN/.test(t) && /status:403/.test(t) && !/headers/.test(t) || (/INVALID_ORIGIN/.test(t) && /status:403/.test(t));
}
function isCatch(c) {
  const b = c.block.statements;
  return b.length === 1 && ts.isReturnStatement(b[0]) && b[0].expression && /^apiErrorResponse\(\w+\)$/.test(b[0].expression.getText());
}

// Routes whose audit/strict-input evidence is detected through the imports the conversion removes; convert after those tests learn the wrapper.
const HOLD = new Set(["src/app/api/admin/placements/applications/refresh/route.ts", "src/app/api/admin/skills/curated-seed/route.ts"]);
for (const p of files) {
  if (converted >= LIMIT) break;
  if (HOLD.has(p)) { bump("held"); continue; }
  let src = fs.readFileSync(p, "utf8");
  if (/@\/security\/route/.test(src)) continue;
  if (!/getCurrentRequestContext\(\)/.test(src)) { bump("no-context"); continue; }
  if (/getAll\(|new Response\(|ReadableStream|Content-Disposition|cookies\(|headers\(\)/.test(src)) { bump("unusual-api"); continue; }
  const sf = ts.createSourceFile(p, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const edits = []; let ok = true; let reason = "";
  const fns = sf.statements.filter((s) => ts.isFunctionDeclaration(s) && s.name && METHODS.includes(s.name.text) && s.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword));
  if (!fns.length) { bump("no-handlers"); continue; }
  const others = sf.statements.filter((s) => ts.isFunctionDeclaration(s) && s.name && /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(s.name.text) && !fns.includes(s));
  if (others.length) { bump("other-methods"); continue; }
  for (const fn of fns) {
    const name = fn.name.text;
    const st = [...fn.body.statements];
    let origin = false;
    if (st.length && isOriginGuard(st[0])) { origin = true; st.shift(); }
    if (origin && (name === "GET")) { ok = false; reason = "get-origin"; break; }
    if (!origin && name !== "GET") { ok = false; reason = "mutation-without-origin"; break; }
    if (st.length !== 1 || !ts.isTryStatement(st[0]) || !st[0].catchClause || st[0].finallyBlock || !isCatch(st[0].catchClause)) { ok = false; reason = "shape"; break; }
    const body = st[0].tryBlock.statements;
    const ctxIdx = body.findIndex((s) => ts.isVariableStatement(s) && s.declarationList.declarations.length === 1 && /^await getCurrentRequestContext\(\)$/.test(s.declarationList.declarations[0].initializer?.getText() ?? ""));
    if (ctxIdx !== 0) { ok = false; reason = "no-ctx-stmt"; break; }
    const ctxName = body[ctxIdx].declarationList.declarations[0].name.getText();
    if (ctxName !== "context") { ok = false; reason = "ctx-name"; break; }
    const rest = body.filter((_, i) => i !== ctxIdx);
    const restText = rest.map((s) => text(src, s)).join("\n");
    if (/getCurrentRequestContext|isSameOriginRequest|apiErrorResponse/.test(restText)) { ok = false; reason = "residual-helper"; break; }
    const ps = fn.parameters;
    if (!ps.length || ps[0].name.getText() !== "request" || ps.length > 2) { ok = false; reason = "params-shape"; break; }
    let usesParams = false;
    if (ps.length === 2) {
      const b = ps[1].name;
      if (!ts.isObjectBindingPattern(b) || b.elements.length !== 1 || b.elements[0].name.getText() !== "params" || b.elements[0].propertyName || b.elements[0].initializer) { ok = false; reason = "ctx-binding"; break; }
      usesParams = true;
    }
    // rewrite `await params` -> `params` inside the kept statements
    let newBody = ""; 
    const parts = [];
    for (const s of rest) {
      let t = text(src, s); const base = s.getStart();
      const reps = [];
      (function v(n) { if (ts.isAwaitExpression(n) && n.expression.getText() === "params") reps.push([n.getStart() - base, n.getEnd() - base, "params"]); ts.forEachChild(n, v); })(s);
      for (const [a, b, r] of reps.sort((x, y) => y[0] - x[0])) t = t.slice(0, a) + r + t.slice(b);
      parts.push(t);
    }
    const hasParams = usesParams && /\bparams\b/.test(parts.join("\n"));
    const usesRequest = /\brequest\b/.test(parts.join("\n"));
    const args = [usesRequest ? "request" : null, "context: actor", hasParams ? "params" : null].filter(Boolean).join(", ");
    const inner = parts.map((t) => "    " + t).join("\n");
    const out = `export const ${name} = route(\n  { auth: "user", permission: "service-enforced" },\n  async ({ ${args} }) => {\n    const context = actor!;\n${inner}\n  },\n);`;
    edits.push([fn.getStart(), fn.getEnd(), out]);
    handlers++;
  }
  if (!ok) { bump(reason); handlers -= 0; continue; }
  let out = src; for (const [a, b, s] of edits.sort((x, y) => y[0] - x[0])) out = out.slice(0, a) + s + out.slice(b);
  // drop now-unused imports and type aliases
  const count = (id) => (out.match(new RegExp("\b" + id + "\b", "g")) || []).length;
  const dropImport = (id) => {
    out = out.replace(new RegExp("^import \{ " + id + " \} from \"[^\"]+\";\r?\n", "m"), "");
    out = out.replace(new RegExp("\b" + id + ",\s*"), (m) => (count(id) === 1 ? "" : m));
  };
  for (const id of ["getCurrentRequestContext", "isSameOriginRequest", "apiErrorResponse"]) if (count(id) === 1) dropImport(id);
  for (const m of out.matchAll(/^type (\w+) = [\s\S]*?;\r?\n\r?\n?/gm)) if (count(m[1]) === 1) out = out.replace(m[0], "");
  out = out.replace(/(^import[^\n]*\n)(?![\s\S]*^import)/m, "$1");
  const firstImport = out.search(/^import /m);
  out = out.slice(0, firstImport) + 'import { route } from "@/security/route";\n' + out.slice(firstImport);
  converted++;
  if (APPLY) fs.writeFileSync(p, out);
}
console.log(APPLY ? "APPLIED" : "DRY", "routes", converted, "handlers", handlers, JSON.stringify(skip));
