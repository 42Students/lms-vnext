// Rules for the central security ratchet. A route file counts as "on the wrapper" when it imports route from @/security/route.
export const RULES = {
  "route-not-on-wrapper": "API route does not use the central route() wrapper",
  "route-on-shim-only": "API route is behind the secured() chokepoint (scope, request id, audit) but not yet on the full route() wrapper with a named permission",
  "sensitive-without-step-up": "sensitive action (bulk export/import, role or permission change, user disable/delete, secret/integration or tenant settings) without step-up authentication (stepUp: true, or requireRecentDeviceAuthentication)",
  "raw-request-json": "route reads the body with request.json() instead of the bounded reader/wrapper",
  "direct-db-in-route": "route imports getDb directly instead of going through the data layer",
  "table-without-tenant-classification": "table has no college_id, no derived policy and is not listed in docs/security/table-classification.json",
  "sql-raw-dynamic": "sql.raw() is called with anything but a fixed string literal (SQL injection risk; use bound parameters)",
  "tenant-table-without-rls": "table has a college_id column but no tenant RLS policy (run: node scripts/generate-rls-migration.mjs)",
  "server-action-unguarded": "file declares a \"use server\" action but never calls guardAction() from @/security/action (permission, rate limit, audit)",
  "service-enforced": "route declares permission 'service-enforced' (replace with a named permission)",
  "actor-owned": "route declares permission 'actor-owned' (no registry permission; only for self-service routes whose authority is the actor's own identity or grants, reviewed individually)",
};

// Owner decision 2026-11-06: these need a sign-in no older than 15 minutes.
export const SENSITIVE_PATH = new RegExp(
  "(?:^|[/])(?:[a-z-]*export[a-z-]*|[a-z-]*import[a-z-]*|grants?|roles?|permissions?|disable|secrets?|integrations?|tenant-settings|platform-settings|api-keys?)(?:[/]|$)",
  "i",
);

// Reviewed false positives of the path rule: each needs a written reason.
export const STEP_UP_EXEMPT = {
  "college/roles/suggest/popular": "Read-only list of popular job-role names for autocomplete; no role or permission of any user changes.",
  "placements/jobs/[jobId]/roles": "Job role options of a placement drive (a hiring concept), not membership roles or permissions.",
  "placements/jobs/[jobId]/roles/[roleOptionId]": "Job role option of a placement drive (a hiring concept), not membership roles or permissions.",
  "placements/company-share/[token]/export": "Token link for a company without an account: there is no session to step up; the share token and access proof gate it.",
};

export function scanRoute(path, source) {
  if (!/^src\/app\/api\/.+\/route\.ts$/.test(path.split(String.fromCharCode(92)).join("/"))) return [];
  const out = [];
  const onWrapper = /from\s+["']@\/security\/(?:route|internal-route)["']/.test(source);
  // A pure alias file (`export {GET} from "<other route>"`, `export const GET = imported;`) defines no handler of
  // its own; the route it points at is the one that must be wrapped, and the guard checks that file.
  const METHOD = "(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)";
  const definesHandler = new RegExp(`export\\s+(?:async\\s+)?function\\s+${METHOD}\\b|export\\s+const\\s+${METHOD}\\s*=\\s*(?:async\\b|\\(|function\\b|\\w+\\s*\\()`).test(source);
  if (!definesHandler) return [];
  const onShim =/from\s+["']@\/security\/secure-handler["']/.test(source);
  if (!onWrapper && onShim) out.push({ rule: "route-on-shim-only" });
  else if (!onWrapper) out.push({ rule: "route-not-on-wrapper" });
  // Sensitive = a state-changing handler, or a download, on a sensitive path.
  const apiPath = path.split(String.fromCharCode(92)).join("/").slice("src/app/api/".length);
  const sensitiveHandler =
    new RegExp("export\\s+(?:async\\s+function|const)\\s+(?:POST|PUT|PATCH|DELETE)\\b").test(source) ||
    /attachment|text\/csv|\.csv/i.test(source);
  const exemptKey = apiPath.replace(/\/route\.ts$/, "");
  if (SENSITIVE_PATH.test(apiPath) && sensitiveHandler && !(exemptKey in STEP_UP_EXEMPT) &&!/stepUp\s*:|requireRecentDeviceAuthentication/.test(source)) {
    out.push({ rule: "sensitive-without-step-up" });
  }
  for (const _ of source.matchAll(/\b(?:request|req)\.json\s*\(/g)) out.push({ rule: "raw-request-json" });
  if (/\bgetDb\b/.test(source) && /from\s+["']@\/db/.test(source)) out.push({ rule: "direct-db-in-route" });
  for (const _ of source.matchAll(/permission:\s*["']service-enforced["']/g)) out.push({ rule: "service-enforced" });
  for (const _ of source.matchAll(/permission:\s*["']actor-owned["']/g)) out.push({ rule: "actor-owned" });
  return out;
}

// Server actions are a second way into the system besides API routes. A file with a "use server" directive must call
// guardAction() from @/security/action, or each of its directives is counted against the baseline.
export function scanServerAction(path, source) {
  const p = path.split(String.fromCharCode(92)).join("/");
  if (!/^src\/.+\.(?:ts|tsx)$/.test(p) || p.startsWith("src/app/api/")) return [];
  const directives = [...source.matchAll(/^[ \t]*["']use server["'];?[ \t]*\r?$/gm)];
  if (!directives.length || /\bguardAction\s*\(/.test(source)) return [];
  return directives.map(() => ({ rule: "server-action-unguarded" }));
}

// sql.raw() puts its argument into the statement unescaped. Only a fixed string literal is allowed; anything built from
// variables or interpolation must use bound parameters. Static schema constants (src/db/schema) are out of scope.
export function scanSqlRaw(path, source) {
  const p = path.split(String.fromCharCode(92)).join("/");
  if (!/^src\/.+\.(?:ts|tsx)$/.test(p) || p.startsWith("src/db/schema/")) return [];
  const all = [...source.matchAll(/\bsql\.raw\(/g)].length;
  if (!all) return [];
  const fixed = [...source.matchAll(/\bsql\.raw\(\s*(?:'[^'\n]*'|"[^"\n]*"|`[^`$\n]*`)\s*\)/g)].length;
  return Array.from({ length: Math.max(0, all - fixed) }, () => ({ rule: "sql-raw-dynamic" }));
}
