#!/usr/bin/env node
// Static Super Admin guard scanner for Phase 3. Usage: node scripts/audit/phase3-superadmin-scan.mjs [--json]
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};
const rel = (p) => relative(root, p).replaceAll("\\", "/");
const read = (p) => readFileSync(p, "utf8");

const MUTATING = ["POST", "PUT", "PATCH", "DELETE"];
const HELPERS = "resolveActingCollege|assertPersistedPlatformPermission|require[A-Z][A-Za-z]*(?:Admin|Scope|Access|Actor|Permission)[A-Za-z]*\\(";
const GUARD_SUPER = new RegExp(`isSuperAdmin\\(|requireSuperAdmin|SUPER_ADMIN|${HELPERS}`);
const GUARD_PERM = new RegExp(`requirePermission\\(|\\bcan\\(|${HELPERS}`);
const methodsOf = (src) =>
  [...src.matchAll(/export\s+(?:async\s+function|const|function)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)].map((m) => m[1]);

const signals = (src) => ({
  context: /getCurrentRequestContext|getRequestContext|requireRequestContext/.test(src),
  superAdmin: GUARD_SUPER.test(src),
  permission: GUARD_PERM.test(src),
  origin: /isSameOriginRequest|assertSameOrigin|originGuard|rejectCrossOrigin/.test(src),
  bodyJson: /request\.json\(\)|req\.json\(\)/.test(src),
  boundedBody: /readBoundedJson|readJsonBody|boundedJson|content-length|maxBytes|MAX_BODY/i.test(src),
  zod: /z\.(object|strictObject|uuid|string)|\.safeParse\(|\.parse\(/.test(src),
  audit: /audit|recordActivity|activityEvent|writeActivity|appendActivity|insertActivity/i.test(src),
  confirm: /confirm|typedConfirmation|confirmation/i.test(src),
  dbWriteInline: /\.(insert|update|delete)\(/.test(src),
});

/** Pages */
const pageRoots = ["src/app/(authenticated)/admin", "src/app/(authenticated)/superadmin"];
const pages = pageRoots
  .flatMap((r) => walk(join(root, r)))
  .filter((p) => /[\\/]page\.tsx$/.test(p))
  .map((p) => {
    const src = read(p);
    const s = signals(src);
    const stub = !s.context && src.replace(/\s+/g, " ").length < 400;
    return { file: rel(p), ...s, stub, redirects: /redirect\(|notFound\(/.test(src) };
  });

const importCache = new Map();
const resolveImport = (spec) => {
  if (!spec.startsWith("@/")) return null;
  const base = join(root, "src", spec.slice(2));
  for (const c of [base + ".ts", base + ".tsx", join(base, "index.ts")]) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
};
/** Guard signals found in the route's imported service modules (one hop). */
const indirectSignals = (src) => {
  const out = { superAdmin: false, permission: false, internalSecret: false };
  for (const m of src.matchAll(/from\s+["'](@\/[^"']+)["']/g)) {
    const file = resolveImport(m[1]);
    if (!file) continue;
    if (!importCache.has(file)) {
      const s = read(file);
      importCache.set(file, {
        superAdmin: GUARD_SUPER.test(s),
        permission: GUARD_PERM.test(s),
        internalSecret: /timingSafeEqual|INTERNAL_|verifyInternal|internalAuth|CRON_SECRET|x-internal/i.test(s),
      });
    }
    const v = importCache.get(file);
    out.superAdmin ||= v.superAdmin;
    out.permission ||= v.permission;
    out.internalSecret ||= v.internalSecret;
  }
  return out;
};

/** API routes */
const routes = walk(join(root, "src/app/api"))
  .filter((p) => /[\\/]route\.ts$/.test(p))
  .map((p) => {
    const src = read(p);
    const methods = methodsOf(src);
    const s = signals(src);
    const mutating = methods.filter((m) => MUTATING.includes(m));
    const superish = s.superAdmin || /\/api\/(admin|organizations|tenant-domains|features|bug-tracker|e2e|internal|dev)\b/.test("/" + rel(p));
    // a GET handler that writes inline
    const getBlock = src.match(/export\s+(?:async\s+function|const)\s+GET[\s\S]*?(?=export\s+(?:async\s+function|const)\s+(?:POST|PUT|PATCH|DELETE)|$)/);
    const getWrites = Boolean(getBlock && /\.(insert|update|delete)\(/.test(getBlock[0]));
    const ind = indirectSignals(src);
    return { file: rel(p), methods, mutating, superish, getWrites, ind, ...s };
  });

const gaps = [];
for (const p of pages) {
  if (!p.context && !p.stub) gaps.push({ sev: "MEDIUM", kind: "page-no-context", file: p.file, note: "page has no request-context call; relies on /admin layout only" });
  if (p.stub) gaps.push({ sev: "HIGH", kind: "stub-page-no-guard", file: p.file, note: "tiny page without any guard (layout is the only barrier)" });
}
for (const r of routes) {
  const isInternal = r.file.startsWith("src/app/api/internal/");
  const routeSrc = readFileSync(join(root, r.file), "utf8");
  const secretOk = r.ind.internalSecret || /timingSafeEqual|authorization/i.test(routeSrc);
  if (isInternal && !secretOk) gaps.push({ sev: "HIGH", kind: "internal-route-no-secret-check", file: r.file, note: "internal route shows no shared-secret verification" });
  const guarded = r.context || r.permission || r.superAdmin || r.ind.superAdmin || r.ind.permission;
  if (r.methods.length && !guarded && !/\/api\/(public|webhooks|auth|hello|client-errors|dev|e2e|internal)\b/.test("/" + r.file.replace(/^src\/app/, ""))) {
    gaps.push({ sev: r.mutating.length ? "HIGH" : "MEDIUM", kind: "route-no-guard-signal", file: r.file, note: `methods ${r.methods.join(",")} show no context/permission/superadmin call` });
  }
  if (r.mutating.length && !r.origin) gaps.push({ sev: "MEDIUM", kind: "mutating-route-no-origin-check", file: r.file, note: `${r.mutating.join(",")} without same-origin check in file (may be covered by proxy)` });
  if (r.getWrites) gaps.push({ sev: "HIGH", kind: "mutating-GET", file: r.file, note: "GET handler performs inline insert/update/delete" });
  if (r.bodyJson && !r.boundedBody) gaps.push({ sev: "LOW", kind: "unbounded-json", file: r.file, note: "request.json() with no visible body bound" });
  if (r.superish && r.mutating.length && !isInternal && !r.superAdmin && !r.permission && !(r.context && (r.ind.superAdmin || r.ind.permission))) gaps.push({ sev: "HIGH", kind: "superish-mutation-no-role-check", file: r.file, note: "admin-ish mutating route without SUPER_ADMIN/permission check" });
}

const result = { pages, routes, gaps };
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(result, null, 1));
} else {
  const by = (sev) => gaps.filter((g) => g.sev === sev).length;
  console.log(`pages=${pages.length} routes=${routes.length} gaps=${gaps.length} HIGH=${by("HIGH")} MEDIUM=${by("MEDIUM")} LOW=${by("LOW")}`);
  const kinds = {};
  for (const g of gaps) kinds[`${g.sev} ${g.kind}`] = (kinds[`${g.sev} ${g.kind}`] || 0) + 1;
  console.log(kinds);
}

/** --md: per-surface tables for docs/audit/phase3-superadmin-audit.md */
if (process.argv.includes("--md")) {
  const cls = (r) => (r.context && (r.superAdmin || r.permission) ? "direct" : r.ind.superAdmin || r.ind.permission ? "one-hop" : r.context ? "context-only (service not detected)" : "none");
  const adminRoutes = routes.filter((r) => r.file.startsWith("src/app/api/admin/"));
  const adminPages = pages.filter((p) => p.file.includes("/admin/"));
  const legacy = pages.filter((p) => p.file.includes("/superadmin/"));
  console.log(`## Pages (${adminPages.length} under /admin, ${legacy.length} legacy /superadmin aliases)\n`);
  console.log("| Page | Own context call | Redirect | Notes |\n|---|---|---|---|");
  for (const p of adminPages) console.log(`| ${p.file.replace("src/app/(authenticated)/", "")} | ${p.context ? "yes" : "no (layout + delegate)"} | ${p.redirects ? "yes" : "no"} | ${p.superAdmin ? "isSuperAdmin" : ""} |`);
  console.log(`\n## Admin API routes (${adminRoutes.length})\n`);
  console.log("| Route | Methods | Guard | Origin check | Body bound |\n|---|---|---|---|---|");
  for (const r of adminRoutes) console.log(`| ${r.file.replace("src/app/api/", "")} | ${r.methods.join(",")} | ${cls(r)} | ${r.mutating.length ? (r.origin ? "yes" : "NO") : "n/a"} | ${r.bodyJson ? (r.boundedBody ? "bounded" : "unbounded") : "n/a"} |`);
}
