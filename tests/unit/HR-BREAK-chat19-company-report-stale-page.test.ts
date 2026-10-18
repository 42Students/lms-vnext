import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 clampRecruiterCompanyReportPage,recruiterCompanyReportsQuerySchema,
} from "@/modules/placements/recruiter-company-reports-model";

describe("HR-BREAK-REPORTS-02: stale employer report pages fail back within granted portfolio",()=>{
 it.each([
  {page:1,total:0,size:25,expected:1},
  {page:9999,total:0,size:25,expected:1},
  {page:10,total:1,size:25,expected:1},
  {page:10,total:26,size:25,expected:2},
  {page:10,total:51,size:25,expected:3},
  {page:2,total:51,size:25,expected:2},
  {page:10000,total:50,size:50,expected:1},
  {page:10000,total:501,size:50,expected:11},
 ])("clamps stale page $page of $total authorized drives to $expected",({page,total,size,expected})=>{
   expect(clampRecruiterCompanyReportPage(page,total,size)).toBe(expected);
 });
 it("preserves strict input validation of ID/status/pages and cannot widen a college scope",()=>{
  expect(recruiterCompanyReportsQuerySchema.safeParse({page:10001}).success).toBe(false);
  expect(recruiterCompanyReportsQuerySchema.safeParse({pageSize:51}).success).toBe(false);
  expect(recruiterCompanyReportsQuerySchema.safeParse({status:"ALL_COLLEGES"}).success).toBe(false);
  expect(recruiterCompanyReportsQuerySchema.safeParse({relationshipId:"foreign"}).success).toBe(false);
 });
 it("clamps unexpected raw boundary values without unsafe offsets",()=>{
  for(const page of [Infinity,NaN,-1,0,2.5]){
   expect(clampRecruiterCompanyReportPage(page,26,25)).toBe(1);
  }
  expect(clampRecruiterCompanyReportPage(9999,-1,25)).toBe(1);
 });
 it("service applies final page to scoped SQL offset and returns the same page to UI",()=>{
  const source=readFileSync("src/modules/placements/recruiter-company-reports-service.ts","utf8");
  expect(source).toContain("clampRecruiterCompanyReportPage(");
  expect(source).toContain("(effectivePage - 1) * query.pageSize");
  expect(source).toContain("page: effectivePage,");
  expect(source).toContain("eq(placementJobs.collegeId, collegeId)");
  expect(source).toContain("placementJobs.companyRelationshipId");
  expect(source).toContain("requirePermission(");
 });
});
