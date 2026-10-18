import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { legacyAcademicStatus } from "@/modules/academics/legacy-academic-status";

const read = (path: string) => readFileSync(path, "utf8");
const routeList = read("docs/orchestrator/ui-ux/pages-admin.md");
const allRoutes = [...routeList.matchAll(/^- \[ \] `([^`]+)` \((.+)\)$/gm)];
const firstThird = allRoutes.slice(0, 37).map(([, route, path]) => ({route, path}));

describe("chat-13 Super Admin /admin first-third route source audit", () => {
  it("SA-ADMIN-FIRST-01 has exactly 37 first-third page entries in the approved 111-route manifest", () => {
    expect(allRoutes.length).toBeGreaterThanOrEqual(111);
    expect(firstThird).toHaveLength(37);
    expect(firstThird[0]?.route).toBe("/admin/academics");
    expect(firstThird[36]?.route).toBe("/admin/hr");
  });

  for (const {route, path} of firstThird) {
    it("UX-admin-first-"+route.replaceAll("/", "-")+" requires authenticated context and no raw unresponsive tables", () => {
      const source = read(path);
      expect(source).toContain("getCurrentRequestContext");
      expect(source).not.toMatch(/<table(?:\s|>)/);
      expect(source).not.toMatch(/min-h-(?:7|8|9|10)(?!\d)/);
      expect(source).not.toMatch(/target=(?:\"|')_blank(?:\"|')/);
    });
  }

  it("SA-ADMIN-FIRST-02 requires selected college scope before academic workspaces are loaded", () => {
    const page=read("src/app/(authenticated)/admin/academics/page.tsx");
    expect(page).toContain("context.adminScope?.collegeId ?? null");
    expect(page.indexOf("if (!collegeId)")).toBeLessThan(page.indexOf("getAcademicsWorkspace("));
    expect(page).toContain('title="Select a college scope"');
    const section=read("src/app/(authenticated)/admin/academics/sections/[sectionId]/page.tsx");
    expect(section).toContain('redirect("/admin/academics")');
    expect(section).toContain("resolveSuperAdminSectionDetail(context, sectionId)");
    const resolver=read("src/modules/admin-ui/super-admin-section-detail.ts");
    expect(resolver).toContain("resourceVisibleInAdminScope(context.adminScope, section)");
    expect(resolver).toContain("requirePermission(context, \"academics.read\"");
  });

  it("SA-ADMIN-FIRST-03 preserves data-safe college resource not-found and archived parent guidance", () => {
    const page=read("src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx");
    const service=read("src/modules/colleges/admin-tenant-lifecycle-service.ts");
    expect(page).toContain("getSuperAdminTenantLifecycleDetail(context,collegeId)");
    expect(page).toContain("error.code===\"COLLEGE_NOT_FOUND\") notFound()");
    expect(page).toContain("Restore the parent organization before restoring this college.");
    expect(service).toContain("if (scope?.collegeId) where.push(eq(colleges.id, scope.collegeId))");
    expect(service).toContain("if (scope?.organizationId) where.push(eq(colleges.organizationId, scope.organizationId))");
    expect(service).toContain("query.organizationId !== scope.organizationId");
  });

  it("SA-ADMIN-FIRST-04 fails closed on malformed employer searches and impossible selected-college filters", () => {
    const page=read("src/app/(authenticated)/admin/companies/page.tsx");
    const service=read("src/modules/placements/admin-company-directory-service.ts");
    expect(page).toContain("adminCompaniesQuerySchema.safeParse(");
    expect(page).toContain('title="Invalid company search"');
    expect(page).toContain("listSuperAdminCompanyDirectory(context, parsed.data)");
    expect(service).toContain("if (query.collegeId && query.collegeId !== selected.collegeId)");
    expect(service).toContain("eq(colleges.organizationId, selected.organizationId)");
  });

  it("SA-ADMIN-FIRST-05 does not mix company drive-history stats across tenants", () => {
    const page=read("src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx");
    const service=read("src/modules/placements/admin-company-drive-history-service.ts");
    expect(page).toContain('redirect("/admin/companies")');
    expect(page).toContain("listSuperAdminCompanyDriveHistory(context,companyId)");
    expect(page).toContain('caption="Company drive history"');
    expect(service).toContain('resolveActingCollege(context, "placements.read")');
    expect(service).toContain("eq(placementJobs.collegeId, acting.collegeId)");
    expect(service).toContain("eq(placementCompanyRelationships.collegeId, acting.collegeId)");
    expect(service).toContain(".limit(501)");
    expect(service).toContain("const visibleJobs=jobs.slice(0,500)");
    expect(service).toContain("truncated:jobs.length>500");
    expect(service).toContain("eq(collegeMemberships.collegeId,acting.collegeId)");
  });

  it("SA-ADMIN-FIRST-06 hides student contact details and rejects forged learner membership IDs", () => {
    const page=read("src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx");
    expect(page).toContain("strictTraceRouteParams(paramsValue)");
    expect(page).toContain("adminModuleTraceQuerySchema.safeParse(");
    expect(page).toContain("The directory");
    expect(page).toContain("neither email addresses nor phone");
    const student=read("src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/page.tsx");
    expect(student).toContain("!z.uuid().safeParse(membershipId).success)notFound()");
    expect(student).toContain("if(!result?.selected)notFound()");
    expect(student).toContain('rule.module!=="placements"?');
    expect(student).toContain("No email or mobile details are exposed.");
  });

  it("SA-ADMIN-FIRST-07 uses strict recruiter filters and explicit friendly recovery", () => {
    const page=read("src/app/(authenticated)/admin/hr/page.tsx");
    expect(page).toContain('requirePermission(');
    expect(page).toContain('"admin-scope.select"');
    expect(page).toContain("parseSuperAdminHrPageParams(params)");
    expect(page).toContain('title="Invalid account filters"');
    expect(page).toContain('loadError =');
    expect(page).toContain("scopeKey");
  });

  it("SA-ADMIN-FIRST-08 retains exact academic lifecycle labels, including archived batches as inactive", () => {
    expect(legacyAcademicStatus("ACTIVE")).toBe("Active");
    expect(legacyAcademicStatus("PLANNED",true)).toBe("Inactive");
    expect(legacyAcademicStatus("ARCHIVED",true)).toBe("Inactive");
    expect(legacyAcademicStatus("COMPLETED",true)).toBe("Completed");
    const page=read("src/app/(authenticated)/admin/batches/page.tsx");
    expect(page).toMatch(/legacyAcademicStatus\(row\.status,\s*true\)/);
  });
});
