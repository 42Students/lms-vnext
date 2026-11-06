/**
 * Method-by-method API security census; not a source-string "all guarded" gate.
 * Enumerates exported Next App Router HTTP handlers with the TypeScript AST.
 * A call found in one method never counts as protection for another method.
 *
 * Inventory evidence is NOT authorization proof: delegated guards, actual
 * resource ownership and negative database tests require a human review.
 *
 *   node scripts/security/api-method-inventory.mjs
 *   node scripts/security/api-method-inventory.mjs --json <output.json>
 *   node scripts/security/api-method-inventory.mjs --enforce-new --enforce-guards
 *
 * --enforce-new blocks unreviewed NEW methods since an immutable adoption
 * baseline, rather than pretending the existing 1,001 routes were certified.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]);
const MUTATIONS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const AUTH_CALLS = new Set([
  "getCurrentRequestContext", "getCurrentDeviceSession",
  "verifyIdentitySessionCookie", "resolveSession",
]);
const ORIGIN_CALLS = new Set([
  "isSameOriginRequest", "guardLoginRequest", "scannerCallbackRequestRejection",
]);
const PERMISSION_CALLS = new Set([
  "requirePermission", "assertPersistedPlatformPermission", "can",
  "assertPersistedPlatformPermissionBatch",
]);
// Adoption snapshot is a commit, not a moving branch or an automatic whitelist.
const ADOPTION_REF = "2f482a698f61918a0abf4ad27cfb282314f3b851";
// Known evidence snapshot; direct calls are a regression signal, NOT proof
// of runtime authorization or tenant/resource ownership.
const GUARD_EVIDENCE_REF = "3d515ffd7d3a05ca5a0c1fdd3bf0864127f04f8b";
const API_ROOT = path.resolve("src/app/api");

function exported(node) {
  return Boolean(node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword));
}

function calledIdentifiers(node) {
  if (!node) return [];
  const result = new Set();
  function visit(item) {
    if (ts.isCallExpression(item)) {
      if (ts.isIdentifier(item.expression)) result.add(item.expression.text);
      else if (ts.isPropertyAccessExpression(item.expression)) result.add(item.expression.name.text);
    }
    ts.forEachChild(item, visit);
  }
  visit(node);
  return [...result].sort();
}

/** Extract ACTUAL exported HTTP methods, including arrow functions and re-exports. */
export function extractApiMethods(source, fileName = "route.ts") {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const methods = new Map();
  const localFunctions = new Map(file.statements
    .filter(s => ts.isFunctionDeclaration(s) && s.name && s.body).map(s => [s.name.text, s.body]));
  function put(name, node, kind) {
    if (!METHODS.has(name)) return;
    let calls = calledIdentifiers(node);
    let bodyText = node?.getText() ?? "";
    // secured(handleX): the guard calls live in the wrapped local function, so count them for this method.
    if (calls.includes("secured") && node) {
      const inner = new Set(calls);
      (function visit(item) {
        if (ts.isCallExpression(item) && ts.isIdentifier(item.expression) && item.expression.text === "secured") {
          for (const arg of item.arguments) {
            if (ts.isIdentifier(arg) && localFunctions.has(arg.text)) { calledIdentifiers(localFunctions.get(arg.text)).forEach(c => inner.add(c)); bodyText += localFunctions.get(arg.text).getText(); }
          }
        }
        ts.forEachChild(item, visit);
      })(node);
      calls = [...inner].sort();
    }
    // The central route() wrapper resolves the session and (for mutations) checks origin before the handler runs.
    const central = (calls.includes("internalRoute") || calls.includes("webhookRoute")) || calls.includes("route") && !/auth:\s*"public"/.test(node.getText());
    methods.set(name, {
      method: name,
      implementation: kind,
      has_direct_session_evidence: central || calls.some(x => AUTH_CALLS.has(x)),
      has_direct_origin_evidence: central || /headers\.has\(\s*["']origin["']\s*\)/.test(bodyText) || calls.some(x => ORIGIN_CALLS.has(x)),
      has_direct_permission_evidence: calls.some(x => PERMISSION_CALLS.has(x)),
      call_identifiers: calls,
      // Every method is unreviewed until its target resolution, permissions,
      // tenant ancestry, CSRF, side effects and negative tests are traced.
      review_status: "UNREVIEWED",
    });
  }
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && exported(statement) && statement.name) {
      put(statement.name.text, statement.body, "function");
    } else if (ts.isVariableStatement(statement) && exported(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          put(declaration.name.text, declaration.initializer, "variable");
        }
      }
    } else if (ts.isExportDeclaration(statement) &&
        statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const specifier of statement.exportClause.elements) {
        put(specifier.name.text, null, "reexport");
      }
    }
  }
  return [...methods.values()].sort((a, b) => a.method.localeCompare(b.method));
}

function apiFiles(root) {
  const result = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name === "route.ts") result.push(full);
    }
  }
  visit(root);
  return result.sort();
}

export function inventoryApi(root = API_ROOT) {
  const routes = apiFiles(root).map(file => {
    const source = fs.readFileSync(file, "utf8");
    const route = "/api/" + path.relative(root, path.dirname(file)).replaceAll(path.sep, "/");
    return { file: path.relative(process.cwd(), file).replaceAll(path.sep, "/"), route,
      methods: extractApiMethods(source, file) };
  });
  const all = routes.flatMap(r => r.methods.map(m => ({ route: r.route, file: r.file, ...m })));
  return {
    snapshot: "SECURITY_METHOD_CENSUS_V1",
    limitations: [
      "Direct call presence is not proof that a guard is reached or sufficient",
      "An authenticated API still needs server-owned object and tenant lineage authorization",
      "No existing route is certified by this inventory",
    ],
    summary: {
      route_files: routes.length,
      exported_methods: all.length,
      methods_with_direct_session_evidence: all.filter(x => x.has_direct_session_evidence).length,
      unsafe_methods_without_direct_origin_evidence: all.filter(x =>
        MUTATIONS.has(x.method) && !x.has_direct_origin_evidence).length,
      methods_without_direct_session_evidence: all.filter(x => !x.has_direct_session_evidence).length,
      unreviewed_methods: all.length,
    },
    methods: all,
  };
}

/**
 * Compare individual method bodies, never a whole route file. Removing a
 * previously seen guard requires explicit security review even for a legacy
 * method that was present before the new-handler adoption baseline.
 * This flags guard-evidence loss, not necessarily an exploitable bypass.
 */
// Reviewed moves of a guard out of the handler body. Each needs a rationale; nothing else may drop evidence.
const REVIEWED_EVIDENCE_MOVES = [
  { file: "src/app/api/tracker/audit-findings/sync/route.ts", method: "POST", reason: "DIRECT_PERMISSION_EVIDENCE_REMOVED",
    rationale: "The persisted-grant check now runs inside the importer's write transaction (assertPersistedPlatformPermission in independent-audit-inbox-importer.ts); the handler keeps requirePermission via authorizedContext()." },
];
export function directGuardEvidenceRegressions(beforeSource, afterSource, fileName = "route.ts") {
  const oldMethods = new Map(extractApiMethods(beforeSource, fileName)
    .map(method => [method.method, method]));
  const checks = [
    ["has_direct_session_evidence", "DIRECT_SESSION_EVIDENCE_REMOVED"],
    ["has_direct_origin_evidence", "DIRECT_ORIGIN_EVIDENCE_REMOVED"],
    ["has_direct_permission_evidence", "DIRECT_PERMISSION_EVIDENCE_REMOVED"],
  ];
  const gaps = [];
  for (const current of extractApiMethods(afterSource, fileName)) {
    const previous = oldMethods.get(current.method);
    if (!previous) continue; // genuinely new handlers use --enforce-new.
    for (const [property, reason] of checks) {
      if (previous[property] && !current[property]) {
        if (REVIEWED_EVIDENCE_MOVES.some(x => fileName.split(path.sep).join("/").endsWith(x.file) && x.method === current.method && x.reason === reason)) continue;
        gaps.push({ method: current.method, reason });
      }
    }
  }
  return gaps;
}

function git(args) {
  return execFileSync("git", args, { cwd: process.cwd(), encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"], maxBuffer: 20_000_000 }).trim();
}

function reviewAnnotation(source, method) {
  // Per-method inventory ticket; NOT a substitute for real reviewer approval.
  const lines = source.split(/\r?\n/);
  const escaped = method.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    "@security-reviewed\\s+" + escaped +
    "\\s+auth=(session|signed|anonymous)\\s+" +
    "tenant=([a-z0-9_-]+)\\s+permission=([a-z0-9_.-]+)\\s+" +
    "csrf=([a-z0-9_-]+)\\s+test=([A-Za-z0-9_./-]+)",
  );
  return lines.some(line => pattern.test(line) && line.trim().startsWith("//"));
}

export function findNewMethodReviewGaps(inventory, baseRef = ADOPTION_REF) {
  // Fail closed if baseline history is unavailable; do not silently reset it.
  git(["cat-file", "-e", baseRef + "^{commit}"]);
  const changed = git(["diff", "--name-only", "--diff-filter=ACMR", baseRef, "HEAD", "--", "src/app/api"]);
  const changedPaths = new Set(changed ? changed.split("\n") : []);
  const gaps = [];
  for (const route of inventory.methods.filter(m => changedPaths.has(m.file))) {
    const source = fs.readFileSync(route.file, "utf8");
    let previous = "";
    try {
      previous = git(["show", baseRef + ":" + route.file]);
    } catch (error) {
      // A new file did not exist at the adoption ref; other git errors
      // should not permit an unreviewed method to pass.
      if (!/exists on disk, but not in|does not exist in|Path .* does not exist/.test(
        String(error?.stderr ?? error?.message ?? ""))) {
        // git show returns a nonzero result on a newly added file; still
        // require a review below, never silently ignore this method.
      }
    }
    if (extractApiMethods(previous, route.file).some(m => m.method === route.method)) continue;
    if (!reviewAnnotation(source, route.method)) {
      gaps.push({ route: route.route, method: route.method, reason: "NEW_METHOD_NOT_REVIEWED" });
    }
  }
  return gaps;
}

/**
 * Compare changed existing handlers against a pinned, immutable known
 * baseline. This is deliberately independent of --enforce-new, which catches
 * newly introduced methods but not weakened pre-existing handlers.
 */
export function findExistingGuardEvidenceRegressions(baseRef = GUARD_EVIDENCE_REF) {
  git(["cat-file", "-e", baseRef + "^{commit}"]);
  const changed = git(["diff", "--name-only", "--diff-filter=ACMR",
    baseRef, "HEAD", "--", "src/app/api"]);
  const gaps = [];
  for (const file of changed ? changed.split(/\r?\n/) : []) {
    if (!file.endsWith("/route.ts") || !fs.existsSync(file)) continue;
    let before;
    try {
      before = git(["show", baseRef + ":" + file]);
    } catch {
      // New or renamed route files are handled by the new-method gate.
      continue;
    }
    const after = fs.readFileSync(file, "utf8");
    for (const gap of directGuardEvidenceRegressions(before, after, file)) {
      if (!reviewAnnotation(after, gap.method)) {
        gaps.push({ file, ...gap });
      }
    }
  }
  return gaps;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = inventoryApi();
  const outputIndex = process.argv.indexOf("--json");
  if (outputIndex !== -1) {
    const out = process.argv[outputIndex + 1];
    if (!out || out.startsWith("--")) throw new Error("--json requires a filename");
    fs.writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  }
  console.log(JSON.stringify(report.summary, null, 2));
  // A triage list is not a declaration of exploitable routes: helper calls
  // may enforce origin, worker signatures or session policy transitively.
  if (process.argv.includes("--triage")) {
    const candidates = report.methods.filter(m =>
      (MUTATIONS.has(m.method) && !m.has_direct_origin_evidence) ||
      !m.has_direct_session_evidence,
    ).map(m => ({
      route: m.route,
      method: m.method,
      direct_origin_evidence: m.has_direct_origin_evidence,
      direct_session_evidence: m.has_direct_session_evidence,
      implementation: m.implementation,
    }));
    console.log(JSON.stringify({ review_candidates: candidates }, null, 2));
  }
  if (process.argv.includes("--enforce-guards")) {
    const gaps = findExistingGuardEvidenceRegressions();
    for (const gap of gaps) console.error(JSON.stringify(gap));
    if (gaps.length) {
      console.error("Existing API method lost direct security guard evidence; review is required.");
      process.exitCode = 1;
    }
  }
  if (process.argv.includes("--enforce-new")) {
    const gaps = findNewMethodReviewGaps(report);
    for (const gap of gaps) console.error(JSON.stringify(gap));
    if (gaps.length) {
      console.error("New API methods require an explicit per-method security review.");
      process.exitCode = 1;
    }
  }
}
