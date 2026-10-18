import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");
describe("College placement verified operational parity",()=>{
 it("COL-placements-11 retention report and college student placement lookup are accessible",()=>{
  {const body=source("src/app/(authenticated)/college/placements/retention/page.tsx");expect(body).toContain("Data retention report");expect(body).toContain("getCollegeApplicationRetentionReport");}
  {const body=source("src/app/(authenticated)/college/placements/student-lookup/page.tsx");expect(body).toContain("Student placement lookup");expect(body).toContain("lookupCollegeStudentPlacement");}
  {const body=source("src/modules/placements/college-retention-report-service.ts");expect(body).toContain("collegeApplicationRetentionCutoff(new Date())");expect(body).toContain(".limit(200)");
    const policy=source("src/modules/placements/college-retention-report-policy.ts");
    expect(policy).toContain("COLLEGE_APPLICATION_RETENTION_DAYS = 180");
    expect(policy).toContain("COLLEGE_APPLICATION_RETENTION_DAYS * 86400000");
    expect(policy).toContain("Number.isFinite(now.getTime())");}

 });
 it("COL-placements-13 drive settings support draft edit reopen and impact-preview archive",()=>{
  {const body=source("src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx");expect(body).toContain("PlacementDraftEditForm");expect(body).toContain("CollegeLegacyDriveSettings");expect(body).toContain("CollegeDriveArchiveAction");}
  {const body=source("src/components/placements/college-legacy-drive-settings.tsx");expect(body).toContain("collegeDriveReopenAction");expect(body).toContain("/reopen");}
  {const body=source("src/components/placements/college-drive-archive-action.tsx");expect(body).toContain("View delete impact");expect(body).toContain("applications");expect(body).toContain("rounds");expect(body).toContain("offers");}

 });
 it("COL-placements-17 analytics provide department program batch date funnel company and export",()=>{
  {const body=source("src/app/(authenticated)/college/hiring-dashboard/page.tsx");expect(body).toContain("CollegeHiringFunnel");expect(body).toContain("CollegeReportNavigation");}
  {const body=source("src/components/placements/college-hiring-funnel.tsx");expect(body).toContain("All departments");expect(body).toContain("All programs");expect(body).toContain("All batches");expect(body).toContain("Applied from");expect(body).toContain("Applied to");expect(body).toContain("Hiring Funnel");expect(body).toContain("Company-wise Hiring Report");expect(body).toContain("Avg. time to shortlist");expect(body).toContain("Export CSV");}

 });
 it("COL-placements-18 College report navigation never links to TPO-only reports",()=>{
  {const body=source("src/components/placements/college-report-navigation.tsx");expect(body).toContain("/college/hiring-dashboard");expect(body).toContain("/college/placements/retention");expect(body).toContain("/college/placements/student-lookup");}
  expect(source("src/components/placements/college-report-navigation.tsx")).not.toContain("/tpo/reports");
 });
 it("COL-placements-19 interview directory has filters summary ics and outcome controls",()=>{
  {const body=source("src/app/(authenticated)/college/placements/interviews/page.tsx");expect(body).toContain("Scheduled");expect(body).toContain("Today");expect(body).toContain("Download .ics");expect(body).toContain("CollegeInterviewStatusActions");expect(body).toContain("companyId");expect(body).toContain("departmentId");}
  {const body=source("src/components/placements/college-interview-status-actions.tsx");expect(body).toContain("Mark as Completed");expect(body).toContain("No Show");expect(body).toContain("expectedVersion");}

 });
 it("COL-placements-23 college placement policy editor omission is intentional legacy permission boundary",()=>{
  {const body=source("docs/audit/pages/college/placements.md");expect(body).toContain("COL-placements-23");expect(body).toContain("super admin only");}
  {const body=source("docs/audit/owner-decisions-resolved.md");expect(body).toContain("OD-07");}

 });
});
