import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseAdminDirectorySearchParams } from "@/modules/colleges/admin-directory-query-model";
import { canManageCollegeDirectoryRow } from "@/modules/colleges/admin-directory-access-model";
import { can, requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";

const organizationId = "50000000-0000-4000-8000-000000000001";
const otherOrganizationId = "50000000-0000-4000-8000-000000000002";
const collegeId = "40000000-0000-4000-8000-000000000001";
const otherCollegeId = "40000000-0000-4000-8000-000000000002";
const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const superAdmin = (scope: RequestContext["adminScope"] = null): RequestContext => ({
  user: { id: "user", identityUid: "identity", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null,
  adminScope: scope,
});

describe("Super Admin colleges and organizations directory contracts (chat-4)", () => {
  it("SA-colleges-directory-01 parses a search/pagination query without discarding legitimate filters", () => {
    expect(parseAdminDirectorySearchParams({})).toEqual({ q: "", page: 1, pageSize: 25 });
    expect(parseAdminDirectorySearchParams({ q: "  College  ", page: "3", pageSize: "50" }))
      .toEqual({ q: "College", page: 3, pageSize: 50 });
    for (const size of [10, 25, 50, 100]) {
      expect(parseAdminDirectorySearchParams({ pageSize: String(size) })?.pageSize).toBe(size);
    }
    expect(parseAdminDirectorySearchParams({ q: "a".repeat(100) })?.q).toHaveLength(100);
  });

  it("SA-colleges-directory-02 denies duplicate, unknown (including empty), invalid and oversized query keys", () => {
    for (const query of [
      { q: ["college", "foreign"] },
      { page: ["1", "2"] },
      { pageSize: ["25", "100"] },
      { secret: "" },
      { hidden: "true" },
      { q: "a".repeat(101) },
      { page: "0" },
      { page: "-1" },
      { page: "1.5" },
      { page: "1e2" },
      { page: "0x10" },
      { page: " 2 " },
      { page: "Infinity" },
      { page: "1001" },
      { pageSize: "5" },
      { pageSize: "200" },
      { pageSize: "1.5" },
      { pageSize: "1e2" },
      { pageSize: "0x19" },
    ]) {
      expect(parseAdminDirectorySearchParams(query)).toBeNull();
    }
  });

  it("SA-colleges-directory-03 scopes an organization-selected Super Admin to colleges in that organization", () => {
    const admin = superAdmin({ organizationId, collegeId: null });
    expect(canManageCollegeDirectoryRow(admin, { id: collegeId, organizationId })).toBe(true);
    expect(canManageCollegeDirectoryRow(admin, { id: otherCollegeId, organizationId: otherOrganizationId })).toBe(false);
  });

  it("SA-colleges-directory-04 scopes a college-selected Super Admin to that exact college", () => {
    const admin = superAdmin({ organizationId, collegeId });
    expect(canManageCollegeDirectoryRow(admin, { id: collegeId, organizationId })).toBe(true);
    expect(canManageCollegeDirectoryRow(admin, { id: otherCollegeId, organizationId })).toBe(false);
    expect(canManageCollegeDirectoryRow(admin, { id: collegeId, organizationId: otherOrganizationId })).toBe(false);
  });

  it("SA-colleges-directory-05 hides mutation controls from deactivated and non-Super Admin sessions", () => {
    const disabled = superAdmin();
    const session: RequestContext = {
      ...disabled, user: { ...disabled.user, platformStatus: "DISABLED" },
    };
    const college = { id: collegeId, organizationId };
    expect(canManageCollegeDirectoryRow(session, college)).toBe(false);
    expect(can(session, "admin-scope.select")).toBe(false);
    expect(() => requirePermission(session, "admin-scope.select")).toThrow(AuthorizationError);

    const collegeAdmin: RequestContext = {
      user: { id: "admin", identityUid: "college-identity", platformStatus: "ACTIVE", systemRoles: [] },
      membership: { id: "member", collegeId, organizationId, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
    };
    expect(can(collegeAdmin, "admin-scope.select")).toBe(false);
    expect(() => requirePermission(collegeAdmin, "admin-scope.select")).toThrow(AuthorizationError);
  });

  it("SA-colleges-directory-06 checks the Super Admin permission before even rendering invalid-filter errors", () => {
    const collegePage = source("src/app/(authenticated)/admin/colleges/page.tsx");
    const organizationPage = source("src/app/(authenticated)/admin/organizations/page.tsx");
    const check = 'requirePermission(context, "admin-scope.select")';
    expect(collegePage).toContain(check);
    // The organizations page may use its compact style, but must guard the same capability.
    expect(organizationPage).toMatch(/requirePermission\(context,\s*"admin-scope\.select"\)/);
    for (const page of [collegePage, organizationPage]) {
      expect(page.indexOf("requirePermission(context")).toBeLessThan(page.indexOf("parseAdminDirectorySearchParams"));
    }
  });

  it("SA-colleges-directory-07 preserves tenant management routes and user-recoverable loading/empty/search states", () => {
    const collegePage = source("src/app/(authenticated)/admin/colleges/page.tsx");
    const organizationPage = source("src/app/(authenticated)/admin/organizations/page.tsx");
    for (const page of [collegePage, organizationPage]) {
      expect(page).toContain("Invalid ");
      expect(page).toContain("Clear filters");
      expect(page).toContain("pageSize");
      expect(page).toContain("<Pagination");
      expect(page).toContain("<DataTable");
    }
    expect(collegePage).toContain("No colleges match your search");
    expect(collegePage).toContain("CollegeCreateForm");
    expect(collegePage).toContain("CollegeBulkImport");
    expect(organizationPage).toContain("OrganizationCreateForm");
    expect(organizationPage).toContain("listArchivedOrganizations(context)");
  });
});
