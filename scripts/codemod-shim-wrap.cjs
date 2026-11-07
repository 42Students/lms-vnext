// Moves routes that are still behind the secured() shim onto route() WITHOUT rewriting their handlers:
//   export const GET = secured(handleGET, { stepUp: true });
// becomes
//   export const GET = route({ auth: "user", permission: "service-enforced", stepUp: true }, ({ request, params }) => handleGET(...));
// The handler keeps its own checks and error mapping; route() adds origin -> auth -> rate limit -> audit in front.
// Usage: node scripts/codemod-shim-wrap.cjs [--apply] [--files list.txt]   (WHY=1 prints skip reasons)
const ts = require("typescript");
const fs = require("fs"), cp = require("child_process");
const APPLY = process.argv.includes("--apply");
// --public: wrap routes that are reachable without a session (sign-in, token links, OAuth callbacks, machine callers). The handler keeps
// its own credential/signature/state checks; route() adds request id, no-store, a per-address budget and error mapping.
const PUBLIC = process.argv.includes("--public");
function publicReason(p) {
  if (new RegExp('(^|\/)api\/(internal|webhooks?)(\/|$)').test(p)) return ["Machine-to-machine endpoint: the handler authenticates the caller with its own shared secret or signature.", "Callers are servers or schedulers and send no browser Origin; the handler checks its credential instead."];
  if (new RegExp('(^|\/)api\/(v1\/)?auth(\/|$)').test(p)) return ["Sign-in, recovery and session endpoints run before or independently of a session; each handler enforces its own challenge, device or session-state checks.", "The handler applies its own origin and challenge checks, unchanged by this wrapper."];
  if (/callback|oauth|google/.test(p)) return ["OAuth redirect endpoint: the handler validates the signed state and the signed-in user itself and redirects on failure.", "Redirects come from the identity provider; the handler validates state instead of Origin."];
  return ["Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check."];
}
const fi = process.argv.indexOf("--files");
const only = fi > 0 ? new Set(fs.readFileSync(process.argv[fi + 1], "utf8").split("\n").map((s) => s.trim()).filter(Boolean)) : null;
const files = cp.execFileSync("git", ["ls-files", "src/app/api"], { encoding: "utf8" }).split("\n").filter((f) => f.endsWith("/route.ts") && (!only || only.has(f)));
const skip = {}; let cur = "";
const bump = (k) => { skip[k] = (skip[k] || 0) + 1; if (process.env.WHY) console.log(k, cur); };
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
let converted = 0;

// Routes that must stay public or machine-authenticated are handled by hand.
const NOT_USER = /\/api\/(auth|public|internal|webhooks?|health|cron|telegram|scan|inbound|callback|oauth|track|unsubscribe|r2|files\/public)\b|callback|webhook|\/ics\b/i;
const SESSION_HINT = /getCurrentRequestContext|requireSession|getCurrentSession|currentSession|resolveRequestContext|requireStaffContext|getRequestContext/;

function importedSources(src, file) {
  const out = [];
  for (const m of src.matchAll(/from\s+["'](@\/[^"']+)["']/g)) out.push(m[1]);
  return out.map((p) => {
    const base = "src/" + p.slice(2);
    for (const cand of [base + ".ts", base + ".tsx", base + "/index.ts"]) if (fs.existsSync(cand)) return cand;
    return null;
  }).filter(Boolean);
}
const memo = new Map();
function resolvesSession(file, depth) {
  const key = file + depth;
  if (memo.has(key)) return memo.get(key);
  let ok = false;
  try {
    const src = fs.readFileSync(file, "utf8");
    if (SESSION_HINT.test(src)) ok = true;
    else if (depth > 0) ok = importedSources(src, file).some((f) => !/^src\/(lib|components)\//.test(f) && resolvesSession(f, depth - 1));
  } catch { /* unreadable */ }
  memo.set(key, ok);
  return ok;
}

for (const p of files) {
  cur = p;
  const src = fs.readFileSync(p, "utf8");
  if (!/@\/security\/secure-handler["']/.test(src)) continue;
  if (/@\/security\/route["']/.test(src) && !/\bsecured\(/.test(src)) continue;
  if (!PUBLIC && !process.env.FORCE_USER && NOT_USER.test("/" + p.replace(/^src\/app\//, ""))) { bump("not-user-path"); continue; }
  
  const sf = ts.createSourceFile(p, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const fnDecls = new Map();
  for (const s of sf.statements) if (ts.isFunctionDeclaration(s) && s.name) fnDecls.set(s.name.text, s);
  // Every exported HTTP method must be a plain secured(handler[, literal options]) so nothing is left half-converted.
  const exported = [];
  let bad = "";
  for (const s of sf.statements) {
    if (ts.isFunctionDeclaration(s) && s.name && /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(s.name.text) && s.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) { bad = "plain-export"; break; }
    if (!ts.isVariableStatement(s) || !s.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
    const d = s.declarationList.declarations[0];
    if (!d || !ts.isIdentifier(d.name) || !/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(d.name.text)) continue;
    if (!METHODS.includes(d.name.text)) { bad = "method"; break; }
    const c = d.initializer;
    if (c && ts.isIdentifier(c)) continue; // alias such as export const PUT = PATCH: stays valid once PATCH is a route()
    if (!c || !ts.isCallExpression(c) || c.expression.getText() !== "secured" || !ts.isIdentifier(c.arguments[0])) { bad = "not-secured-ident"; break; }
    const fn = fnDecls.get(c.arguments[0].text);
    if (!fn || fn.parameters.length > 2) { bad = "handler-shape"; break; }
    let opts = {};
    if (c.arguments[1]) {
      const o = c.arguments[1];
      if (!ts.isObjectLiteralExpression(o)) { bad = "opts"; break; }
      for (const pr of o.properties) {
        if (!ts.isPropertyAssignment(pr)) { bad = "opts"; break; }
        const k = pr.name.getText(), v = pr.initializer.getText();
        if (k === "stepUp" && (v === "true" || /^\{\s*maxAgeSeconds:\s*\d+\s*\}$/.test(v))) opts.stepUp = v;
        else if (k === "csrf" && /^["'](enforce|own)["']$/.test(v)) opts.csrf = v.slice(1, -1);
        else if (k === "permission" && /^["'][a-z0-9_.-]+["']$/.test(v)) opts.permission = v;
        else { bad = "opts"; break; }
      }
      if (bad) break;
    }
    exported.push({ stmt: s, name: d.name.text, fnName: c.arguments[0].text, fn, opts });
  }
  if (bad) { bump(bad); continue; }
  if (!exported.length) { bump("none"); continue; }
  if (exported.some((e) => e.opts.csrf === "own")) { bump("csrf-own"); continue; }
  // The handler's own code, plus the services it calls, must resolve a session; otherwise it is public or machine-authenticated.
  if (!PUBLIC && !process.env.FORCE_USER && !resolvesSession(p, 2)) { bump("no-session-found"); continue; }
  // getAll() on a computed key cannot be mapped to repeatableQuery safely.
  // getAll(key).length comparisons only detect repeats (route() already rejects them); any other computed read needs a manual look.
  if ([...src.matchAll(/getAll\(\s*([^"')\s][^)]*)\)(\s*\.length)?/g)].some((m) => !m[2]) && !process.env.ALLOW_GETALL) { bump("getall-computed"); continue; }
  const repeat = [...new Set([...src.matchAll(/getAll\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]))];
  const edits = [];
  for (const e of exported) {
    const arity = e.fn.parameters.length;
    const [why, csrfWhy] = publicReason("/" + p.replace(/^src\/app\//, ""));
    const parts = PUBLIC
      ? ['auth: "public"', "publicReason: " + JSON.stringify(why), ...(e.opts.csrf === "enforce" ? [] : ["csrf: false", "csrfExemptReason: " + JSON.stringify(csrfWhy)]), "rateLimit: { limit: 3000, windowMs: 60_000 }"]
      : ['auth: "user"', "permission: " + (e.opts.permission ?? '"service-enforced"')];
    if (e.opts.stepUp && !PUBLIC) parts.push("stepUp: " + e.opts.stepUp);
    if (repeat.length) parts.push("repeatableQuery: [" + repeat.map((k) => JSON.stringify(k)).join(", ") + "]");
    const destruct = arity >= 2 ? "{ request, params }" : "{ request }";
    const call = arity === 0 ? e.fnName + "()" : arity === 1
      ? `${e.fnName}(request as Parameters<typeof ${e.fnName}>[0])`
      : `${e.fnName}(request as Parameters<typeof ${e.fnName}>[0], { params: Promise.resolve(params) } as unknown as Parameters<typeof ${e.fnName}>[1])`;
    const out = `export const ${e.name} = route(\n  { ${parts.join(", ")} },\n  (${arity === 0 ? "" : destruct}) => ${call},\n);`;
    edits.push([e.stmt.getStart(), e.stmt.getEnd(), out]);
  }
  let out = src;
  for (const [a, b, s] of edits.sort((x, y) => y[0] - x[0])) out = out.slice(0, a) + s + out.slice(b);
  if (!/\bsecured\(/.test(out)) out = out.replace(/^import \{ secured \} from "@\/security\/secure-handler";/m, 'import { route } from "@/security/route";');
  else out = out.replace(/^(import \{ secured \} from "@\/security\/secure-handler";)/m, '$1\nimport { route } from "@/security/route";');
  converted++;
  if (APPLY) fs.writeFileSync(p, out);
}
console.log(APPLY ? "APPLIED" : "DRY", "routes", converted, JSON.stringify(skip));
