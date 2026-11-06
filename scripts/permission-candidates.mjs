#!/usr/bin/env node
// Static analysis (best effort, one hop): for every API route handler, which service functions does it call,
// and which permissions / role checks do those functions perform? Output is a REVIEW aid for the permission
// registry, not an authority: a human accepts names before they replace "service-enforced".
//   node scripts/permission-candidates.mjs            -> writes docs/security/permission-candidates.json
//   node scripts/permission-candidates.mjs --summary  -> prints counts only
import ts from "typescript";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = execFileSync("git", ["ls-files", "src/app/api"], { encoding: "utf8" }).split("\n").filter((f) => f.endsWith("/route.ts"));
const cache = new Map();

function resolveModule(spec, from) {
  const base = spec.startsWith("@/") ? path.join(root, "src", spec.slice(2)) : spec.startsWith(".") ? path.resolve(path.dirname(path.join(root, from)), spec) : null;
  if (!base) return null;
  for (const c of [base + ".ts", base + ".tsx", path.join(base, "index.ts")]) if (existsSync(c)) return c;
  return null;
}

// The wrapper and the policy file mention every permission; following calls into them would tag every route with all of them.
const SKIP_MODULE = /(security[\\/]route|permissions[\\/]policy)/;

function moduleFunctions(file) {
  if (cache.has(file)) return cache.get(file);
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const fns = new Map();
  const imports = new Map();
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
      const mod = resolveModule(st.moduleSpecifier.text, path.relative(root, file));
      if (mod && !SKIP_MODULE.test(mod)) for (const e of st.importClause.namedBindings.elements) imports.set(e.name.text, { mod, name: (e.propertyName ?? e.name).text });
    }
    if (ts.isFunctionDeclaration(st) && st.name) fns.set(st.name.text, text.slice(st.getStart(), st.getEnd()));
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer) fns.set(d.name.text, text.slice(d.getStart(), d.getEnd()));
  }
  const out = { fns, text, imports };
  cache.set(file, out);
  return out;
}

/** Follow calls up to `depth` levels: a function's own checks plus those of the functions it calls. */
function deepChecks(file, name, depth, seen = new Set()) {
  const key = file + "#" + name;
  const empty = { permissions: [], roles: [], found: false };
  if (seen.has(key) || depth < 0) return empty;
  seen.add(key);
  const info = moduleFunctions(file);
  const code = info.fns.get(name);
  if (!code) return empty;
  const own = checks(code);
  const permissions = new Set(own.permissions);
  const roles = new Set(own.roles);
  for (const m of code.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
    const callee = m[1];
    if (callee === name) continue;
    let target = null;
    if (info.imports.has(callee)) target = { file: info.imports.get(callee).mod, name: info.imports.get(callee).name };
    else if (info.fns.has(callee)) target = { file, name: callee };
    if (!target) continue;
    const sub = deepChecks(target.file, target.name, depth - 1, seen);
    sub.permissions.forEach((p) => permissions.add(p));
    sub.roles.forEach((r) => roles.add(r));
  }
  return { permissions: [...permissions], roles: [...roles], found: true };
}

const KNOWN = [...readFileSync("src/modules/permissions/policy.ts", "utf8").split("export type ResourceScope")[0].matchAll(/"([a-z][\w.-]+)"/g)].map((m) => m[1]);

function checks(code) {
  const permissions = new Set();
  const roles = new Set();
  for (const p of KNOWN) if (code.includes('"' + p + '"') || code.includes("'" + p + "'")) permissions.add(p);
  for (const m of code.matchAll(/\b(isSuperAdmin|requireSuperAdmin\w*|requireSuperAdminSelectedCollege)\b/g)) roles.add("SUPER_ADMIN");
  for (const m of code.matchAll(/hasMembershipRole\([^,]+,\s*["']([A-Z_]+)["']/g)) roles.add(m[1]);
  for (const m of code.matchAll(/\b(requireCollegeAdmin\w*|requireTpo\w*|requireFaculty\w*|requireMentor\w*|requireLearner\w*|requireRecruiter\w*)\b/g)) roles.add("helper:" + m[1]);
  for (const m of code.matchAll(/\b((?:require|assert|ensure|authorize|resolveActing|verify)[A-Z]\w*)\s*\(/g)) if (!/(Json|Body|Schema|Param|Query|Input|Origin|Uuid|Id)\w*$/.test(m[1])) roles.add("helper:" + m[1]);
  if (/AuthorizationError|FORBIDDEN|NOT_AUTHORI[SZ]ED|ACCESS_DENIED|SCOPE_REQUIRED|_FORBIDDEN|Forbidden|Unauthori[sz]ed|PERMISSION_DENIED|NOT_ALLOWED/.test(code)) roles.add("guard:throws-forbidden");
  return { permissions: [...permissions], roles: [...roles] };
}

const result = {};
for (const rel of files) {
  const src = readFileSync(rel, "utf8");
  if (!/permission:\s*["']service-enforced["']/.test(src) && !/getCurrentRequestContext/.test(src)) continue;
  const sf = ts.createSourceFile(rel, src, ts.ScriptTarget.Latest, true);
  const imports = new Map(); // local name -> module path
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
      const mod = resolveModule(st.moduleSpecifier.text, rel);
      if (mod && !SKIP_MODULE.test(mod)) for (const e of st.importClause.namedBindings.elements) imports.set(e.name.text, { mod, name: (e.propertyName ?? e.name).text });
    }
  }
  const called = new Set();
  (function visit(n) {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && imports.has(n.expression.text)) called.add(n.expression.text);
    ts.forEachChild(n, visit);
  })(sf);
  const perms = new Set();
  const roles = new Set();
  const calls = [];
  let unresolved = 0;
  for (const local of called) {
    const { mod, name } = imports.get(local);
    if (!moduleFunctions(mod).fns.has(name)) { unresolved++; continue; }
    const c = deepChecks(mod, name, 3);
    calls.push({ fn: name, permissions: c.permissions, roles: c.roles });
    c.permissions.forEach((p) => perms.add(p));
    c.roles.forEach((r) => roles.add(r));
  }
  const own = checks(src);
  own.permissions.forEach((p) => perms.add(p));
  own.roles.forEach((r) => roles.add(r));
  result[rel] = {
    wrapped: /@\/security\/route/.test(src),
    permissions: [...perms].sort(),
    roles: [...roles].sort(),
    calls: calls.map((c) => c.fn).sort(),
    unresolvedCalls: unresolved,
    confidence: perms.size === 1 && !unresolved ? "single-permission" : perms.size > 1 ? "multiple" : roles.size ? "role-only" : "none-found",
  };
}

const counts = {};
for (const v of Object.values(result)) counts[v.confidence] = (counts[v.confidence] ?? 0) + 1;
if (process.argv.includes("--summary")) {
  console.log(JSON.stringify({ routes: Object.keys(result).length, ...counts }, null, 1));
} else {
  writeFileSync("docs/security/permission-candidates.json", JSON.stringify({ generated: "scripts/permission-candidates.mjs", note: "Review aid only; names are accepted by a human before replacing service-enforced.", summary: counts, routes: result }, null, 1) + "\n");
  console.log("wrote docs/security/permission-candidates.json", JSON.stringify(counts));
}
