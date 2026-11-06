// Moves EVERY remaining API route handler behind the central secured() chokepoint without reading or
// changing its body. Shape-independent: works for any handler.
//   node scripts/codemod-secured.cjs [--apply]
const ts = require("typescript");
const fs = require("fs");
const cp = require("child_process");

const APPLY = process.argv.includes("--apply");
const METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
const files = cp.execFileSync("git", ["ls-files", "src/app/api"], { encoding: "utf8" }).split("\n").filter((f) => f.endsWith("/route.ts"));
const stats = { files: 0, handlers: 0, enforce: 0, own: 0 };
const skipped = {};
const bump = (k, f) => ((skipped[k] ??= []).push(f));

for (const path of files) {
  const src = fs.readFileSync(path, "utf8");
  if (/@\/security\/(?:route|internal-route|secure-handler)["']/.test(src)) continue;
  const sf = ts.createSourceFile(path, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const imported = new Set();
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
      for (const e of st.importClause.namedBindings.elements) imported.add(e.name.text);
    }
  }
  const topNames = new Set();
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name) topNames.add(st.name.text);
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) topNames.add(d.name.text);
  }
  const isExported = (n) => n.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  const internalPath = /\/api\/(?:internal|webhooks)\//.test("/" + path.replace(/^src\/app/, ""));
  const edits = [];
  let handlers = 0;

  const optionFor = (method, bodyText) => {
    const mutating = !["GET", "HEAD", "OPTIONS"].includes(method);
    if (!mutating || internalPath) return "own";
    // Enforce centrally only where the handler already checks origin unconditionally.
    // Only where the handler's own denial is the standard { error: "INVALID_ORIGIN" } with status 403 and no
    // custom headers/body: central enforcement then changes nothing the caller can see. Bespoke denials stay "own".
    const compact = bodyText.replace(/\s+/g, "");
    const standard = /if\(!isSameOriginRequest\((?:request|req|_request)\)\)\{?returnNextResponse\.json\(\{error:"INVALID_ORIGIN"\},\{status:403\}\)/.test(compact);
    if (standard && !/headers\.has\(["']origin["']\)&&/.test(compact) && !/guardLoginRequest/.test(compact)) return "enforce";
    return "own";
  };

  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name && METHODS.has(st.name.text) && isExported(st)) {
      const name = st.name.text;
      const inner = "handle" + name;
      if (topNames.has(inner)) { bump("name-collision", path); edits.length = 0; handlers = -1; break; }
      const body = src.slice(st.getStart(), st.getEnd());
      const csrf = optionFor(name, body);
      // remove `export` modifier and rename
      const mods = st.modifiers;
      const exportMod = mods.find((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      edits.push([exportMod.getStart(), exportMod.getEnd() + 1, ""]); // drop "export "
      edits.push([st.name.getStart(), st.name.getEnd(), inner]);
      edits.push([st.getEnd(), st.getEnd(), `\nexport const ${name} = secured(${inner}${csrf === "enforce" ? ", { csrf: \"enforce\" }" : ""});`]);
      stats[csrf]++;
      handlers++;
    } else if (ts.isVariableStatement(st) && isExported(st)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || !METHODS.has(d.name.text) || !d.initializer) continue;
        const name = d.name.text;
        const init = d.initializer;
        if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
          const csrf = optionFor(name, src.slice(init.getStart(), init.getEnd()));
          edits.push([init.getStart(), init.getStart(), "secured("]);
          edits.push([init.getEnd(), init.getEnd(), csrf === "enforce" ? ", { csrf: \"enforce\" })" : ")"]);
          stats[csrf]++;
          handlers++;
        } else if (ts.isIdentifier(init) && !imported.has(init.text) && topNames.has(init.text)) {
          // alias of a local function; if that name is itself an exported-and-wrapped handler, leave the alias plain
          if (METHODS.has(init.text)) continue;
          const csrf = optionFor(name, "");
          edits.push([init.getStart(), init.getEnd(), `secured(${init.text}${csrf === "enforce" ? ", { csrf: \"enforce\" }" : ""})`]);
          stats[csrf]++;
          handlers++;
        } else if (ts.isIdentifier(init) && imported.has(init.text)) {
          // alias of an imported handler: the target route is secured on its own
        } else {
          bump("unrecognised-export-const:" + name, path);
        }
      }
    }
  }
  if (handlers <= 0) { if (handlers === 0) bump("no-wrappable-handler", path); continue; }

  let out = src;
  for (const [a, b, s] of edits.sort((x, y) => y[0] - x[0] || y[1] - x[1])) out = out.slice(0, a) + s + out.slice(b);
  // import after the last top-level import
  const sf2 = ts.createSourceFile(path, out, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let last = null;
  sf2.forEachChild((x) => { if (ts.isImportDeclaration(x)) last = x; });
  const nl = out.includes("\r\n") ? "\r\n" : "\n";
  const line = 'import { secured } from "@/security/secure-handler";';
  out = last ? out.slice(0, last.getEnd()) + nl + line + out.slice(last.getEnd()) : line + nl + out;
  stats.files++;
  stats.handlers += handlers;
  if (APPLY) fs.writeFileSync(path, out);
}

console.log(APPLY ? "APPLIED" : "DRY", JSON.stringify(stats));
for (const [k, v] of Object.entries(skipped)) console.log("skipped", k, v.length, v.slice(0, 3).join(", "));
