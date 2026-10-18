import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const middleThird=[
  "/admin/inbound-mail", "/admin/lecture-halls", "/admin/lecture-halls/[hallId]",
  "/admin/lessons", "/admin/live-classes", "/admin/module-access", "/admin/organizations",
  "/admin/people", "/admin/people/directory", "/admin/people/directory/[membershipId]",
  "/admin/people/directory/[membershipId]/audit", "/admin/people/unassigned",
  "/admin/placements", "/admin/placements/analytics", "/admin/placements/applications",
  "/admin/placements/applications/[applicationId]", "/admin/placements/calendar",
  "/admin/placements/drives", "/admin/placements/hiring", "/admin/placements/interviews",
  "/admin/placements/interviews/[roundId]", "/admin/placements/job-settings",
  "/admin/placements/job-settings/[jobId]", "/admin/placements/jobs/[jobId]",
  "/admin/placements/jobs/[jobId]/applications",
  "/admin/placements/jobs/[jobId]/schedule",
  "/admin/placements/jobs/[jobId]/settings", "/admin/placements/joining",
  "/admin/placements/joining/[offerId]", "/admin/placements/new", "/admin/placements/offers",
  "/admin/placements/offers/[offerId]", "/admin/placements/retention",
  "/admin/placements/screenings", "/admin/placements/screenings/[applicationId]",
  "/admin/placements/seasons", "/admin/placements/seasons/[seasonId]",
] as const;

const entry=(route:string)=>
  readFileSync("src/app/(authenticated)"+route+"/page.tsx","utf8");

describe("SA-admin-middle-inventory-01 37 actual Super Admin page entrypoints",()=>{
  it("SA-admin-middle-inventory-01 retains the exact page count/role journey contract",()=>{
    expect(middleThird).toHaveLength(37);
    expect(new Set(middleThird).size).toBe(37);
  });
  it.each(middleThird)("SA-admin-middle-inventory-01 %s authenticates before any scoped view",route=>{
    const code=entry(route);
    expect(code).toMatch(/export default (?:async )?function|export \{ default \}/);
    if(route==="/admin/live-classes"){
      expect(code).toContain("<SuperAdminContentDirectoryPage");
      const shared=readFileSync("src/components/courses/super-admin-content-directory-page.tsx","utf8");
      expect(shared).toContain("getCurrentRequestContext");
      return;
    }
    expect(code).toContain("getCurrentRequestContext");
  });
  it.each([
    "/admin/placements/applications/[applicationId]",
    "/admin/placements/interviews/[roundId]",
    "/admin/placements/job-settings/[jobId]",
    "/admin/placements/joining/[offerId]",
    "/admin/placements/offers/[offerId]",
    "/admin/placements/screenings/[applicationId]",
    "/admin/placements/seasons/[seasonId]",
  ])("SA-admin-middle-inventory-02 %s asks tenant-scoped service before showing a foreign UUID",route=>{
    const code=entry(route);
    expect(code).toContain("getCurrentRequestContext");
    expect(code).toContain("notFound()");
    expect(code).toMatch(/getSuperAdmin[A-Za-z]+Detail/);
    expect(code).not.toContain("getDb()");
  });
  it.each([
    "applications","hiring","interviews","job-settings",
    "joining","offers","screenings","seasons",
  ])("SA-admin-middle-inventory-03 /admin/placements/%s delegates filtered reads to protected scaffold",view=>{
    const code=entry("/admin/placements/"+view);
    expect(code).toContain("<AdminScopedReadPage");
    expect(code).toContain("getCurrentRequestContext");
  });
});
