// Rules for the central security ratchet. A route file counts as "on the wrapper" when it imports route from @/security/route.
export const RULES = {
  "route-not-on-wrapper": "API route does not use the central route() wrapper",
  "route-on-shim-only": "API route is behind the secured() chokepoint (scope, request id, audit) but not yet on the full route() wrapper with a named permission",
  "sensitive-without-step-up": "sensitive action (bulk export/import, role or permission change, user disable/delete, secret/integration or tenant settings) without step-up authentication (stepUp: true, or requireRecentDeviceAuthentication)",
  "raw-request-json": "route reads the body with request.json() instead of the bounded reader/wrapper",
  "direct-db-in-route": "route imports getDb directly instead of going through the data layer",
  "tenant-table-without-rls": "table has a college_id column but no tenant RLS policy (run: node scripts/generate-rls-migration.mjs)",
  "service-enforced": "route declares permission 'service-enforced' (replace with a named permission)",
};

// Owner decision 2026-11-06: these need a sign-in no older than 15 minutes.
export const SENSITIVE_PATH = new RegExp(
  "(?:^|[/])(?:[a-z-]*export[a-z-]*|[a-z-]*import[a-z-]*|grants?|roles?|permissions?|disable|secrets?|integrations?|tenant-settings|platform-settings|api-keys?)(?:[/]|$)",
  "i",
);

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
  if (SENSITIVE_PATH.test(apiPath) && sensitiveHandler && !/stepUp\s*:|requireRecentDeviceAuthentication/.test(source)) {
    out.push({ rule: "sensitive-without-step-up" });
  }
  for (const _ of source.matchAll(/\b(?:request|req)\.json\s*\(/g)) out.push({ rule: "raw-request-json" });
  if (/\bgetDb\b/.test(source) && /from\s+["']@\/db/.test(source)) out.push({ rule: "direct-db-in-route" });
  for (const _ of source.matchAll(/permission:\s*["']service-enforced["']/g)) out.push({ rule: "service-enforced" });
  return out;
}
