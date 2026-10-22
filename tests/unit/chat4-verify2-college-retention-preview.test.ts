import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {collegeApplicationRetentionCutoff} from "@/modules/placements/college-retention-report-policy";

const get=(path:string)=>readFileSync(path,"utf8");
describe("College Admin 180-day retention disclosure",()=>{
 it("uses an independent lazy read scoped through current membership instead of caller college ID",()=>{
  const page=get("src/app/(authenticated)/college/placements/page.tsx");
  const component=get("src/components/placements/college-retention-inline-preview.tsx");
  const route=get("src/app/api/college/placements/retention/route.ts");
  expect(page).toContain("<CollegeRetentionInlinePreview/>");
  expect(page).not.toContain("verified 180-day college-scoped retention report has not been enabled");
  expect(component).toContain('if(!open)return');
  expect(component).toContain('fetch("/api/college/placements/retention"');
  expect(component).toContain('role="alert"');
  expect(component).toContain("Retry");
  expect(component).toContain('aria-expanded={open}');
  expect(route).toContain("getCurrentRequestContext()");
  expect(route).toContain("getCollegeApplicationRetentionReport(context,");
  expect(route).toContain("olderThanDays:180,page:1,pageSize:100");
  expect(route).toContain("olderThanDays:180,page:2,pageSize:100");
  expect(route).toContain('"Cache-Control":"private, no-store"');
  expect(route).not.toContain("searchParams.get(\"collegeId\")");
 });
 it("uses a real 180-day cutoff and never advertises deletions",()=>{
  const now=new Date("2026-10-22T11:00:00.000Z");
  const cutoff=collegeApplicationRetentionCutoff(now,180);
  expect(cutoff.getTime()).toBe(now.getTime()-180*24*60*60*1000);
  const service=get("src/modules/placements/college-retention-report-service.ts");
  expect(service).toContain("notExists(");
  expect(service).toContain("lt(placementApplications.updatedAt,cutoff)");
  expect(service).toContain("report never removes application");
 });
});
