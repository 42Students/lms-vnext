import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Exact second third of docs/orchestrator/ui-ux/pages-admin.md (positions 38–74). */
const cases: readonly [string, string][] = [
  ["inbound-mail", "requirePermission"],
  ["lecture-halls", "requireSuperAdminSelectedCollege"],
  ["lecture-halls/[hallId]", "requireSuperAdminSelectedCollege"],
  ["lessons", "requireSuperAdminSelectedCollege"],
  ["live-classes", "SuperAdminContentDirectoryPage"],
  ["module-access", "requirePermission"],
  ["organizations", "requirePermission"],
  ["people", "isSuperAdmin"],
  ["people/directory", "isSuperAdmin"],
  ["people/directory/[membershipId]", "isSuperAdmin"],
  ["people/directory/[membershipId]/audit", "listSuperAdminPersonAudit"],
  ["people/unassigned", "isSuperAdmin"],
  ["placements", "getCurrentRequestContext"],
  ["placements/analytics", "requireSuperAdminSelectedCollege"],
  ["placements/applications", "AdminScopedReadPage"],
  ["placements/applications/[applicationId]", "getSuperAdminApplicationDetail"],
  ["placements/calendar", "requireSuperAdminSelectedCollege"],
  ["placements/drives", "requireSuperAdminSelectedCollege"],
  ["placements/hiring", "AdminScopedReadPage"],
  ["placements/interviews", "AdminScopedReadPage"],
  ["placements/interviews/[roundId]", "getSuperAdminInterviewDetail"],
  ["placements/job-settings", "AdminScopedReadPage"],
  ["placements/job-settings/[jobId]", "getSuperAdminJobSettingsDetail"],
  ["placements/jobs/[jobId]", "requireSuperAdminSelectedCollege"],
  ["placements/jobs/[jobId]/applications", "requireSuperAdminSelectedCollege"],
  ["placements/jobs/[jobId]/schedule", "requireSuperAdminSelectedCollege"],
  ["placements/jobs/[jobId]/settings", "requireSuperAdminSelectedCollege"],
  ["placements/joining", "AdminScopedReadPage"],
  ["placements/joining/[offerId]", "getSuperAdminJoiningDetail"],
  ["placements/new", "requireSuperAdminSelectedCollege"],
  ["placements/offers", "AdminScopedReadPage"],
  ["placements/offers/[offerId]", "getSuperAdminOfferDetail"],
  ["placements/retention", "requireSuperAdminSelectedCollege"],
  ["placements/screenings", "AdminScopedReadPage"],
  ["placements/screenings/[applicationId]", "getSuperAdminScreeningDetail"],
  ["placements/seasons", "AdminScopedReadPage"],
  ["placements/seasons/[seasonId]", "getSuperAdminSeasonDetail"],
];

describe("Super Admin second-third page entrypoints and ownership guards", () => {
  it("CHAT6-ADMIN-PAGES-00 covers the exact 37-route audit slice", () => {
    expect(cases).toHaveLength(37);
    expect(new Set(cases.map(([route]) => route)).size).toBe(37);
    expect(cases[0][0]).toBe("inbound-mail");
    expect(cases[cases.length - 1][0]).toBe("placements/seasons/[seasonId]");
  });

  it.each(cases)("CHAT6-ADMIN-PAGE %s keeps its server authorization or secured delegate", (route, guard) => {
    const code=readFileSync(`src/app/(authenticated)/admin/${route}/page.tsx`,"utf8");
    expect(code).toContain(guard);
    if (route!=="live-classes") {
      expect(code).toContain("getCurrentRequestContext");
    }
    if (route.includes("[") && !route.includes("lecture-halls/")) {
      expect(code).toContain("params");
    }
    if (route.startsWith("placements/") && !route.includes("[") &&
        ["hiring","interviews","job-settings","joining","offers","screenings","seasons"].includes(route.slice("placements/".length))) {
      expect(code).toContain("AdminScopedReadPage");
    }
  });

  it("CHAT6-ADMIN-PAGES-01 keeps authorization in the common paged renderer itself", () => {
    const code=readFileSync("src/components/admin/admin-scoped-read-page.tsx","utf8");
    expect(code).toContain("readAdminQuery(await searchParams)");
    expect(code).toContain("if(!isSuperAdmin(context))");
    expect(code).toContain("if(!context.adminScope?.collegeId)");
    expect(code).toContain("const directory=await loader(parsed.data)");
    expect(code).toContain("Directory unavailable");
    expect(code).toContain("No matching records");
    expect(code).toContain("superAdminReadHref");
  });

  it("CHAT6-ADMIN-PAGES-02 prevents orphaned job/application detail reads in the selected college", () => {
    const paths=[
      "src/modules/admin-ui/super-admin-placement-applications-service.ts",
      "src/modules/admin-ui/super-admin-application-detail-service.ts",
      "src/modules/admin-ui/super-admin-hiring-report-filters-service.ts",
    ];
    for (const path of paths) {
      const code=readFileSync(path,"utf8");
      expect(code).toContain("requireSuperAdminSelectedCollege");
      expect(code).toContain("collegeId");
    }
    const detail=readFileSync(paths[1],"utf8");
    expect(detail).toContain("eq(placementJobs.collegeId,scope.collegeId)");
    expect(detail).toContain("eq(collegeMemberships.collegeId,scope.collegeId)");
  });
});
