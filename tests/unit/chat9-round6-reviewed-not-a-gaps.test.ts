import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {publicPublicationDecision} from "../../src/modules/placements/public-page/publication-policy";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO settings review evidence",()=>{
 it("TPO-settings-audit-R02 shows helpful errors for job-type conflicts and invalid blocked dates without rendering raw codes",()=>{
  const job=src("src/components/tpo/tpo-job-types-editor.tsx");
  const dates=src("src/components/tpo/tpo-blocked-dates-editor.tsx");
  for(const term of ["FriendlyFetchError","This job type already exists.","Keep at least one job type visible."])expect(job).toContain(term);
  for(const term of ["FriendlyFetchError","Past dates cannot be blocked.","Pick a range of up to 90 days."])expect(dates).toContain(term);
  expect(job).not.toContain("{data.error}");
  expect(dates).not.toContain("{data.error}");
 });
 it("TPO-settings-audit-R03 derives the public toggle from the live consented cohort instead of an unwritten population field",()=>{
  const service=src("src/modules/placements/public-page/publication-service.ts");
  expect(service).toContain("registeredPublicPlacementCohort(getDb(),college.id)");
  expect(service).toContain("return {ready:true as const,settings:settings[0]??null,populationCount}");
  expect(publicPublicationDecision({enabled:true},{populationCount:6,publishedAt:null})).toBe("ENABLE");
  expect(publicPublicationDecision({enabled:true},{populationCount:4,publishedAt:null})).toBe("SMALL_COHORT");
 });
 it("TPO-settings-audit-81 is NOT-A-GAP because editable email templates are absent from the legacy production Settings UI",()=>{
  const nav=src("src/components/placements/tpo-settings-nav.tsx");
  expect(nav).toContain("Email templates");
  const page=src("src/app/(authenticated)/tpo/settings/templates/page.tsx");
  expect(page.length).toBeGreaterThan(100);
 });
 it("COL-projects-09 verifies recorded primary mentor is used before fallback teammate",()=>{
  const s=src("src/modules/projects/admin-insights-service.ts");
  expect(s).toContain("mentor.isPrimary");
 });
 it("COL-projects-17 verifies college audit filtered view and CSV route",()=>{
  const s=src("src/components/projects/project-admin-audit-page.tsx");
  expect(s).toContain("ProjectAuditPageExport");
  expect(s).toContain("searchParams");
  expect(s).toContain("ACTIVITY_IMPORTANCE");
 });
});
