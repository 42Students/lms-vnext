import { describe, expect, it } from "vitest";
import { listRouteFiles, read, rel, routeReaches } from "../support/route-chain";

/**
 * Whole-API contracts, enforced on every route file, so a new route cannot quietly skip them:
 *  A. every signed-in route reaches an actor-based authorization decision;
 *  B. every route that changes data and reads a body reaches a validation schema (or is a machine route that
 *     takes no body or checks an exact allowlist);
 *  C. every list route that takes a page size or limit reaches a hard upper bound.
 * They prove a check is REACHABLE from the route; they do not replace per-object tests such as
 * tests/integration/sec-same-college-isolation.test.ts.
 */
const routes = listRouteFiles();

const AUTHZ =
  /getCurrentRequestContext\s*\(|requirePermission\s*\(|requireSharedContentAuthority|requireLearn\w*\s*\(|requireFaculty\w*\s*\(|requireCollege\w*\s*\(|requireStaff\w*\s*\(|requireTpo\w*\s*\(|requireRecruiter\w*\s*\(|require[A-Z]\w*(?:Access|Scope|Actor|Context|Authority)\s*\(|assert\w*(?:Access|Permission|Scope|Actor|Authority|Role)\w*\s*\(|authorize\w*\s*\(|hasMembershipRole\s*\(|isSuperAdmin\s*\(|hasActiveRecruiter|AuthorizationError|persisted-actor|currentTenantScope|\bcontext\s*:\s*RequestContext|\(\s*context\b|\bcontext\s*[,)]|\bactor\b/;

const MUTATING = /export\s+(?:const|async function|function)\s+(?:POST|PUT|PATCH|DELETE)\b|export\s*\{[^}]*\b(?:POST|PUT|PATCH|DELETE)\b[^}]*\}/;
const READS_BODY =
  /request\.(?:json|formData|text)\(|boundedRequestJson|readBounded(?:Json|Utf8)Body|body:\s*\{|\bbody\b.*schema|req\.json\(/;
const VALIDATES = /\bz\.(?:object|strictObject|string|array|enum|union|number|literal|coerce)\b|\.safeParse\(|\.parse\(|\bSchema\b|zod/;
const BOUND =
  /\.max\(\s*\d+|Math\.min\(|clamp|\bMAX_[A-Z_]*|maximum|\.limit\(\s*[A-Za-z0-9_.]+\s*\)|\blimit\s*:\s*\d+|LIMIT\s+\d+|pageSize\s*[:=]\s*\d+|\btake\s*:\s*\d+|\.slice\(\s*0\s*,/;
const PAGINATION = /\b(?:pageSize|limit|perPage|take)\b/;

/** A thin legacy alias that forwards to another API route, which is itself checked by these same tests. */
const delegatesToRoute = (source: string) =>
  /from\s+["'](?:@\/app\/api\/[^"']+|\.\.?\/[^"']*route)["']/.test(source);
/** A retired endpoint that only answers a fixed 410 and touches no service. */
const retiredStatic = (source: string) => /status:\s*410/.test(source) && !/@\/modules\//.test(source);

const isUserRoute = (source: string) => /auth:\s*["']user["']/.test(source);
const isReexportOnly = (source: string) =>
  /export\s*\{[^}]*\}\s*from/.test(source) && !/export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|PATCH|DELETE)/.test(source) &&
  !/\broute\(/.test(source);

describe("route contracts across the whole API", () => {
  it("scans every route file", () => {
    expect(routes.length).toBeGreaterThan(900);
  });

  it("A. every signed-in route reaches an actor-based authorization decision", () => {
    const missing: string[] = [];
    for (const file of routes) {
      const source = read(file);
      if (!isUserRoute(source) || isReexportOnly(source)) continue;
      if (delegatesToRoute(source) || retiredStatic(source)) continue;
      if (!routeReaches(file, AUTHZ)) missing.push(rel(file));
    }
    expect(missing, "signed-in routes with no authorization decision reachable").toEqual([]);
  }, 120_000);

  it("A2. re-exported legacy aliases point at a route that is itself guarded", () => {
    const orphans: string[] = [];
    for (const file of routes) {
      const source = read(file);
      if (!isReexportOnly(source)) continue;
      const target = source.match(/from\s+["']([^"']+)["']/)?.[1] ?? "";
      if (!target.startsWith("@/app/api/") && !target.startsWith(".")) orphans.push(rel(file));
    }
    expect(orphans).toEqual([]);
  });

  it("B. every data-changing route that reads a body reaches a validation schema", () => {
    const missing: string[] = [];
    for (const file of routes) {
      const source = read(file);
      if (!MUTATING.test(source) || !READS_BODY.test(source)) continue;
      if (/\binternalRoute\(/.test(source)) continue; // machine routes: credential + empty body or exact allowlist
      if (!routeReaches(file, VALIDATES)) missing.push(rel(file));
    }
    expect(missing, "body-reading mutating routes with no schema reachable").toEqual([]);
  }, 120_000);

  it("C. every list route that takes a page size reaches a hard upper bound", () => {
    // Reviewed false positives: the word 'limit' there is a rate limit, not a page size.
    const rateLimitOnly = new Set([
      "src/app/api/v1/auth/logout/route.ts",
      "src/app/api/v1/public/college-join/[token]/join/route.ts",
      "src/app/api/v1/public/college-join/[token]/send-code/route.ts",
      "src/app/api/v1/public/share/[token]/resumes/route.ts",
      "src/app/api/v1/public/share/[token]/send-code/route.ts",
      "src/app/api/public/campaign-unsubscribe/[token]/route.ts",
    ]);
    const unbounded: string[] = [];
    for (const file of routes) {
      const source = read(file);
      if (!PAGINATION.test(source) || rateLimitOnly.has(rel(file))) continue;
      if (delegatesToRoute(source)) continue;
      if (!routeReaches(file, BOUND)) unbounded.push(rel(file));
    }
    expect(unbounded, "list routes with a page size but no upper bound reachable").toEqual([]);
  }, 120_000);
});
