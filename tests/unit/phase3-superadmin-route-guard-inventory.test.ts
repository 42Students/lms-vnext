import { describe, expect, it } from "vitest";
import {
  GUARD,
  exportedMethods,
  hasGuardWithinOneHop,
  hasRequestContext,
  read,
  rel,
  routeFiles,
} from "./phase3-scan-helpers";

/**
 * Every Super Admin API route must load the request context AND reach a role or
 * permission guard in the route file or in a module it imports (one hop). A new
 * route that does neither fails here instead of shipping as a silent open door.
 */
const ADMIN_ROUTES = routeFiles("src/app/api/admin").map((p) => ({ file: rel(p), abs: p }));
const PLATFORM_ROUTES = [
  ...routeFiles("src/app/api/organizations"),
  ...routeFiles("src/app/api/tenant-domains"),
  ...routeFiles("src/app/api/features"),
].map((p) => ({ file: rel(p), abs: p }));

/**
 * Routes that reach the guard through a deeper helper. `delegate` is the module
 * that holds the real guard; the test below asserts it still contains one.
 */
const TWO_HOP_ALLOWED: Record<string, { delegate: string; reason: string }> = {
  "src/app/api/tenant-domains/[domainId]/verify/route.ts": {
    delegate: "src/modules/tenant-domains/service.ts",
    reason: "same tenant-domains runtime to service.ts chain.",
  },
  "src/app/api/tenant-domains/[domainId]/ensure-token/route.ts": {
    delegate: "src/modules/tenant-domains/service.ts",
    reason: "route() resolves the actor; ensureTenantDomainVerificationToken loads the domain through loadAuthorizedDomain, which requires Super Admin and college.manage.",
  },
  "src/app/api/admin/module-access/tree/route.ts": {
    delegate: "src/modules/module-access/admin-read-service.ts",
    reason: "route() resolves the actor; readCompleteCollegeModuleTree calls getSuperAdminCollegeModuleAccess, which requires Super Admin plus the persisted module-access grant.",
  },
  "src/app/api/admin/tenant-domains/resolve-preview/route.ts": {
    delegate: "src/modules/tenant-domains/service.ts",
    reason: "route() resolves the actor; previewTenantHostResolution requires Super Admin without a narrowed scope and the admin-scope.select permission.",
  },
  "src/app/api/admin/faculty-assignment/export/route.ts": {
    delegate: "src/modules/admin-ui/super-admin-faculty-assignments-service.ts",
    reason: "route() resolves the actor; the CSV service delegates to listAdminFacultyAssignments, which requires Super Admin.",
  },
  "src/app/api/admin/features/[collegeId]/students/[membershipId]/history/export/route.ts": {
    delegate: "src/modules/module-access/admin-trace-service.ts",
    reason: "route() resolves the actor (step-up); listSuperAdminStudentRuleHistory verifies the learner through getSuperAdminLearnerAccessTrace, which requires Super Admin.",
  },
  "src/app/api/admin/onboarding/resolve-preview/route.ts": {
    delegate: "src/modules/tenant-domains/service.ts",
    reason: "route() resolves the actor; previewTenantHostResolutionWithRuntime reaches the tenant-domains service, which requires Super Admin.",
  },
  "src/app/api/tenant-domains/route.ts": {
    delegate: "src/modules/tenant-domains/service.ts",
    reason: "route() resolves the actor; the runtime wrappers call the tenant-domains service, which requires Super Admin and college.manage.",
  },
  "src/app/api/tenant-domains/[domainId]/route.ts": {
    delegate: "src/modules/tenant-domains/service.ts",
    reason: "route() resolves the actor; the runtime wrappers call the tenant-domains service, which requires Super Admin and college.manage.",
  },
  "src/app/api/admin/placements/organization-jobs/route.ts": {
    delegate: "src/modules/placements/organization-application-search-service.ts",
    reason: "route() resolves the actor; the job search resolves its scope in the application-search service, which requires Super Admin and the persisted placements.read grant.",
  },
};

describe("Phase 3: Super Admin API route guard inventory", () => {
  it("finds a realistic number of admin and platform routes (scan is not empty)", () => {
    expect(ADMIN_ROUTES.length).toBeGreaterThan(100);
    expect(PLATFORM_ROUTES.length).toBeGreaterThan(8);
  });

  it("every /api/admin route handler loads the request context", () => {
    const missing = ADMIN_ROUTES.filter(({ abs }) => {
      const src = read(abs);
      if (exportedMethods(src).length === 0) return false; // pure re-export file
      return !hasRequestContext(src) && !/exportSuperAdmin\w+\(request/.test(src);
    }).map((r) => r.file);
    expect(missing, `admin routes with no request-context call: ${missing.join(", ")}`).toEqual([]);
  });

  it("every /api/admin route reaches a role/permission guard within one hop", () => {
    const unguarded = ADMIN_ROUTES.filter(({ file, abs }) => {
      if (exportedMethods(read(abs)).length === 0) return false;
      return !hasGuardWithinOneHop(abs) && !(file in TWO_HOP_ALLOWED);
    }).map((r) => r.file);
    expect(unguarded, `admin routes without a guard signal: ${unguarded.join(", ")}`).toEqual([]);
  });

  it("platform routes (organizations, tenant-domains, features) reach a guard or are explicitly allowed", () => {
    const unguarded = PLATFORM_ROUTES.filter(({ file, abs }) => {
      if (exportedMethods(read(abs)).length === 0) return false;
      return !hasGuardWithinOneHop(abs) && !(file in TWO_HOP_ALLOWED);
    }).map((r) => r.file);
    expect(unguarded, `platform routes without a guard signal: ${unguarded.join(", ")}`).toEqual([]);
  });

  it("each allow-listed delegate module still contains a real guard", () => {
    for (const [file, { delegate, reason }] of Object.entries(TWO_HOP_ALLOWED)) {
      expect(reason.length, `${file} needs a written reason`).toBeGreaterThan(20);
      expect(GUARD.test(read(delegate)), `${delegate} (guard for ${file}) lost its role/permission check`).toBe(true);
    }
  });

  it("the two-hop allow-list only names routes that exist and still need the exception", () => {
    for (const file of Object.keys(TWO_HOP_ALLOWED)) {
      const route = [...ADMIN_ROUTES, ...PLATFORM_ROUTES].find((r) => r.file === file);
      expect(route, `${file} no longer exists; remove it from TWO_HOP_ALLOWED`).toBeDefined();
      expect(
        hasGuardWithinOneHop(route!.abs),
        `${file} now has a one-hop guard; remove it from TWO_HOP_ALLOWED`,
      ).toBe(false);
    }
  });
});
