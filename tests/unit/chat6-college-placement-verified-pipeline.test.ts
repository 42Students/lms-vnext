import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {DRIVE_APPLICATION_BULK_CAP,driveApplicationsQuerySchema} from "@/modules/placements/college-drive-applications-model";
import {COLLEGE_APPLICATION_TRANSITIONS} from "@/modules/placements/college-stage-action-model";
const src=(path:string)=>readFileSync(path,"utf8");
describe("College Admin placement pipeline verified parity",()=>{
 it("COL-placements-01 supports transition guards and per-row/bulk Reinstate/Move",()=>{
  expect(COLLEGE_APPLICATION_TRANSITIONS.APPLIED).toContain("SHORTLISTED");
  expect(COLLEGE_APPLICATION_TRANSITIONS.SHORTLISTED).toContain("ASSESSMENT");
  expect(COLLEGE_APPLICATION_TRANSITIONS.HIRED).toHaveLength(0);
  const controls=src("src/components/placements/college-application-pipeline-controls.tsx");
  for(const word of ["Move to...","Reinstate","Move to Assessment","Mark Hired","reason:reason.trim()"])expect(controls).toContain(word);
  const service=src("src/modules/placements/college-application-stage-service.ts");
  expect(service).toContain("placementCollegeApplicationStageHistory");
  expect(service).toContain("inAppNotifications");
 });
 it("COL-placements-04 schedules and changes college interview outcomes",()=>{
  const page=src("src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx");
  const controls=src("src/components/placements/college-interview-appointments.tsx");
  expect(page).toContain("CollegeInterviewAppointments");
  for(const label of ["Schedule interview","Edit interview","No Show","Cancel","COMPLETED","NO_SHOW","Schedule and notify"])expect(controls).toContain(label);
  expect(controls).toContain("collegeInterviewIcs");
 });
 it("COL-placements-05 scopes applicant filters by source academic department program batch and stage",()=>{
  const parsed=driveApplicationsQuerySchema.safeParse({source:"INTERNAL",status:"ALL",screening:"ALL",stage:"SHORTLISTED"});
  expect(parsed.success).toBe(true);
  const page=src("src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx");
  for(const label of ['name="source"','name="departmentId"','name="programId"','name="cohortId"'])expect(page).toContain(label);
  const model=src("src/modules/placements/college-drive-applications-model.ts");
  expect(model).toContain("stage");
 });
 it("COL-placements-06 caps all-matching selection and reports per-candidate failures",()=>{
  expect(DRIVE_APPLICATION_BULK_CAP).toBe(3000);
  const controls=src("src/components/placements/college-application-pipeline-controls.tsx");
  const service=src("src/modules/placements/college-application-stage-service.ts");
  expect(controls).toContain("selectedCount");
  expect(controls).toContain('status==="skipped"');
  expect(service).toContain("matchingFilter");
  expect(service).toContain("results.push({applicationId,status:");
 });
});
