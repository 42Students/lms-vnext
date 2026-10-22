import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { RequestContext } from "@/modules/identity/context";
import { canManageCollegeDirectoryRow } from "@/modules/colleges/admin-directory-access-model";
import { parseAdminDirectorySearchParams } from "@/modules/colleges/admin-directory-query-model";
import { preferredNewTenantOrganization, createdOrganizationStepHref } from "@/modules/colleges/admin-tenant-organization-step";
import { tenantSetupLinksAvailable, tenantLifecycleHref } from "@/modules/colleges/admin-tenant-lifecycle-model";
import { can } from "@/modules/permissions/policy";

const collegeA = "11111111-1111-4111-8111-111111111111";
const collegeB = "22222222-2222-4222-8222-222222222222";
const orgA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const orgB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const read = (path: string) => readFileSync(path, "utf8");
function admin(): RequestContext {
  return {
    user: { id: "admin", identityUid: "admin", systemRoles: ["SUPER_ADMIN"], platformStatus: "ACTIVE" },
    membership: null,
    adminScope: { collegeId: collegeA, organizationId: orgA },
  };
}

describe("Super Admin colleges/organizations/tenants adversarial audit", () => {
  it("SA-colleges-tenants-BREAK-01 invalid or repeated filters fail before listing a tenant", () => {
    for (const invalid of [
      { page: ["1", "2"] },
      { page: "0" }, { page: "1.5" }, { pageSize: "200" },
      { q: "x".repeat(101) }, { collegeId: collegeA }, { organizationId: orgA },
    ]) expect(parseAdminDirectorySearchParams(invalid)).toBeNull();
    expect(parseAdminDirectorySearchParams({ q: "42 ", pageSize: "10" }))
      .toEqual({ q: "42", page: 1, pageSize: 10 });
    for (const page of [
      "src/app/(authenticated)/admin/colleges/page.tsx",
      "src/app/(authenticated)/admin/organizations/page.tsx",
    ]) {
      const source = read(page);
      expect(source.indexOf("parseAdminDirectorySearchParams(await searchParams)"))
        .toBeLessThan(source.indexOf(page.includes("/colleges/")
          ? "listColleges(context)" : "listOrganizations(context)"));
      expect(source).toContain("Invalid");
      expect(source).toContain("Clear filters");
    }
  });

  it("SA-colleges-tenants-BREAK-02 selected-college scope cannot enumerate every organization", () => {
    const source = read("src/modules/organizations/service.ts");
    const branch = source.slice(source.indexOf("export async function listOrganizations("), source.indexOf("export async function createOrganization("));
    const selected = branch.indexOf("if(selected?.collegeId)");
    const unrestricted = branch.indexOf("const globalList=tx.select");
    expect(selected).toBeGreaterThan(-1);
    expect(selected).toBeLessThan(unrestricted);
    const scoped = branch.slice(selected, unrestricted);
    expect(scoped).toContain("eq(colleges.id, selected.collegeId)");
    expect(scoped).toContain("eq(colleges.organizationId,organizations.id)");
    expect(scoped).toContain('eq(colleges.status,"ACTIVE")');
    expect(scoped).toContain("selectedOrganizationId?eq(organizations.id,selectedOrganizationId)");
    expect(scoped).toContain('requirePermission(context,"organization.read"');
    expect(scoped).toContain(".limit(1)");
  });

  it("SA-colleges-tenants-BREAK-03 a forged organization filter never overrides the persisted college parent", () => {
    const source = read("src/modules/colleges/service.ts");
    const block = source.slice(source.indexOf("if (selectedCollegeId)"), source.indexOf("const effectiveOrganizationId =", source.indexOf("if (selectedCollegeId)")));
    expect(block).toContain("eq(colleges.id, selectedCollegeId)");
    expect(block).toContain("eq(organizations.id, colleges.organizationId)");
    expect(block).toContain('eq(organizations.status, "ACTIVE")');
    expect(block).toContain("eq(colleges.organizationId, selectedOrganizationId)");
    expect(block).toContain("eq(colleges.organizationId, requestedOrganizationId)");
    expect(can(admin(), "college.read", { collegeId: collegeA, organizationId: orgB })).toBe(false);
    expect(can(admin(), "college.read", { collegeId: collegeB, organizationId: orgA })).toBe(false);
    expect(can(admin(), "college.read", { collegeId: collegeA, organizationId: orgA })).toBe(true);
  });

  it("SA-colleges-tenants-BREAK-04 actions never appear for a foreign or disabled tenant scope", () => {
    const context = admin();
    const allowed = { id: collegeA, organizationId: orgA };
    const foreignCollege = { id: collegeB, organizationId: orgA };
    const foreignOrg = { id: collegeA, organizationId: orgB };
    expect(canManageCollegeDirectoryRow(context, allowed)).toBe(true);
    expect(canManageCollegeDirectoryRow(context, foreignCollege)).toBe(false);
    expect(canManageCollegeDirectoryRow(context, foreignOrg)).toBe(false);
    expect(canManageCollegeDirectoryRow({ ...context, user: { ...context.user, platformStatus: "DISABLED" } }, allowed)).toBe(false);
    expect(canManageCollegeDirectoryRow({ ...context, adminScope: { collegeId: null, organizationId: orgB } }, allowed)).toBe(false);
    const page = read("src/app/(authenticated)/admin/colleges/page.tsx");
    expect(page).toContain("college.canManage ? <>");
    expect(page).toContain("canManageCollegeDirectoryRow(context,college)");
  });

  it("SA-colleges-tenants-BREAK-05 cannot preselect an unauthorized organization in the onboarding wizard", () => {
    const allowed = [{ id: orgA }];
    expect(preferredNewTenantOrganization(orgA, allowed)).toBe(orgA);
    expect(preferredNewTenantOrganization(orgB, allowed)).toBeNull();
    expect(preferredNewTenantOrganization([orgA, orgA], allowed)).toBeNull();
    expect(preferredNewTenantOrganization("javascript:alert(1)", allowed)).toBeNull();
    expect(preferredNewTenantOrganization(undefined, allowed)).toBeNull();
    expect(createdOrganizationStepHref({ organization: { id: orgA } }))
      .toBe("/admin/tenants/create?organizationId=" + orgA);
    expect(createdOrganizationStepHref({ organization: { id: "not-valid" } })).toBeNull();
  });

  it("SA-colleges-tenants-BREAK-06 tenant setup forbids archived parent or college", () => {
    expect(tenantSetupLinksAvailable("ACTIVE", "ACTIVE")).toBe(true);
    expect(tenantSetupLinksAvailable("ACTIVE", "ARCHIVED")).toBe(false);
    expect(tenantSetupLinksAvailable("ARCHIVED", "ACTIVE")).toBe(false);
    expect(tenantSetupLinksAvailable("ARCHIVED", "ARCHIVED")).toBe(false);
    expect(tenantLifecycleHref({ status: "ARCHIVED", page: 2 }))
      .toBe("/admin/tenants?status=ARCHIVED&page=2");
    expect(() => tenantLifecycleHref({ status: "INTERNAL" })).toThrow();
    const page = read("src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx");
    expect(page).toContain('item.status==="ARCHIVED"&&item.organizationStatus==="ACTIVE"');
    expect(page).toContain("Restore the parent organization before restoring this college.");
    expect(page).toContain("tenantSetupLinksAvailable(item.status,item.organizationStatus)");
  });
});
