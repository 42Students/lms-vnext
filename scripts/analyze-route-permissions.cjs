// Read-only analysis: for each route handler that says permission "service-enforced", find the service functions it calls
// and the permission each one checks unconditionally at the top of its body. Writes scratch/route-permission-analysis.json.
// Usage: node scripts/analyze-route-permissions.cjs
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const root = process.cwd();
const fileCache = new Map();
function parse(file) {
  if (fileCache.has(file)) return fileCache.get(file);
  const text = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  fileCache.set(file, sf);
  return sf;
}
function resolveModule(spec, from) {
  let base;
  if (spec.startsWith("@/")) base = path.join(root, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const c of [base + ".ts", base + ".tsx", path.join(base, "index.ts")]) if (fs.existsSync(c)) return c;
  return null;
}
function routeFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) routeFiles(p, out);
    else if (e.name === "route.ts") out.push(p);
  }
  return out;
}
/** Permissions checked by statements directly in the function body (not inside if/try/loops). */
function topLevelChecks(fnBody) {
  const found = [];
  if (!fnBody || !ts.isBlock(fnBody)) return found;
  for (const st of fnBody.statements) {
    let expr = null;
    if (ts.isExpressionStatement(st)) expr = st.expression;
    else if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) if (d.initializer) expr = d.initializer;
    }
    if (expr && ts.isAwaitExpression(expr)) expr = expr.expression;
    if (expr && ts.isCallExpression(expr) && ts.isIdentifier(expr.expression) && /^require(Actor)?Permission$/.test(expr.expression.text)) {
      const arg = expr.arguments[1];
      if (arg && ts.isStringLiteralLike(arg)) found.push(arg.text);
    }
  }
  return found;
}
function findFunction(sf, name) {
  let result = null;
  sf.forEachChild(function visit(node) {
    if (result) return;
    if (ts.isFunctionDeclaration(node) && node.name && node.name.text === name) result = node.body;
    else if (ts.isVariableStatement(node)) {
      for (const d of node.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.name.text === name && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) result = d.initializer.body;
      }
    }
  });
  return result;
}

/** Local + imported function bodies visible from a source file. */
function scopeOf(file) {
  const sf = parse(file);
  const imports = new Map();
  sf.forEachChild((node) => {
    if (ts.isImportDeclaration(node) && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
      const target = resolveModule(node.moduleSpecifier.text, file);
      if (!target || !target.includes(path.join("src", "modules"))) return;
      for (const el of node.importClause.namedBindings.elements) imports.set(el.name.text, { file: target, exported: (el.propertyName ?? el.name).text });
    }
  });
  return { sf, imports };
}
function calleesAtTopLevel(body) {
  const names = [];
  if (!body || !ts.isBlock(body)) return names;
  for (const st of body.statements) {
    let expr = null;
    if (ts.isExpressionStatement(st)) expr = st.expression;
    else if (ts.isReturnStatement(st)) expr = st.expression;
    else if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (d.initializer) expr = d.initializer;
    while (expr && (ts.isAwaitExpression(expr) || ts.isParenthesizedExpression(expr))) expr = expr.expression;
    if (expr && ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) names.push(expr.expression.text);
  }
  return names;
}
function checksOf(file, fnName, depth, seen) {
  const key = file + "#" + fnName;
  if (depth > 3 || seen.has(key)) return [];
  seen.add(key);
  const { sf, imports } = scopeOf(file);
  const body = findFunction(sf, fnName);
  const out = [...topLevelChecks(body)];
  for (const callee of calleesAtTopLevel(body)) {
    if (/^require(Actor)?Permission$/.test(callee)) continue;
    const imp = imports.get(callee);
    if (imp) out.push(...checksOf(imp.file, imp.exported, depth + 1, seen));
    else if (findFunction(sf, callee)) out.push(...checksOf(file, callee, depth + 1, seen));
  }
  return out;
}

const results = [];
for (const file of routeFiles(path.join(root, "src/app"))) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes('permission: "service-enforced"')) continue;
  const sf = parse(file);
  const imports = new Map(); // local name -> {file, exported}
  sf.forEachChild((node) => {
    if (ts.isImportDeclaration(node) && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
      const target = resolveModule(node.moduleSpecifier.text, file);
      if (!target || !target.includes(path.join("src", "modules"))) return;
      for (const el of node.importClause.namedBindings.elements) imports.set(el.name.text, { file: target, exported: (el.propertyName ?? el.name).text });
    }
  });
  const called = new Set();
  (function walk(n) {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && imports.has(n.expression.text)) called.add(n.expression.text);
    ts.forEachChild(n, walk);
  })(sf);
  const detail = [];
  for (const local of called) {
    const imp = imports.get(local);
    const body = findFunction(parse(imp.file), imp.exported);
    detail.push({ fn: imp.exported, module: path.relative(root, imp.file).replace(/\\/g, "/"), checks: [...new Set(checksOf(imp.file, imp.exported, 0, new Set()))] });
  }
  const methods = [...text.matchAll(/export const (GET|POST|PUT|PATCH|DELETE) = route\(/g)].map((m) => m[1]);
  results.push({ route: path.relative(root, file).replace(/\\/g, "/"), methods, detail });
}
fs.mkdirSync("scratch", { recursive: true });
fs.writeFileSync("scratch/route-permission-analysis.json", JSON.stringify(results, null, 1));
let single = 0, none = 0, mixed = 0, noCalls = 0;
for (const r of results) {
  if (r.detail.length === 0) { noCalls++; continue; }
  const sets = r.detail.map((d) => d.checks.join("|"));
  if (sets.every((s) => s === "")) none++;
  else if (sets.every((s) => s !== "" && s === sets[0]) && r.methods.length === 1) single++;
  else mixed++;
}
console.log({ routes: results.length, singleUnanimous: single, noTopLevelCheck: none, mixed, noServiceCalls: noCalls });
