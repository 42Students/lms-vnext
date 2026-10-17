import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoApplicantPipelineParams} from "@/modules/placements/tpo-applicant-pipeline-model";
const source=(path:string)=>readFileSync(path,"utf8");
describe("TPO drive applicant partial parity and query safety",()=>{
 it("TPO-drive-workspace-22 joins candidate academic evidence before selecting marks",()=>{
  const service=source("src/modules/placements/tpo-applicant-pipeline-service.ts");
  const start=service.indexOf("const records=await tx.select({");
  const end=service.indexOf("const allFiltered=",start);
  const sql=service.slice(start,end);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  expect(sql).toContain("cgpaHundredths:placementCandidateAcademicEvidence.cgpaHundredths");
  expect(sql).toContain(".leftJoin(placementCandidateAcademicEvidence,");
  expect(sql).toContain("eq(placementCandidateAcademicEvidence.membershipId,collegeMemberships.id)");
 });
 it("TPO-drive-workspace-23 exposes server validated flag and applied window filters",()=>{
  const component=source("src/components/tpo/tpo-applications-spreadsheet.tsx");
  const model=tpoApplicantPipelineParams;
  for(const flag of ["WITHDRAWAL_REQUESTED","NO_SHOW","PLACED_ELSEWHERE","ADDED_BY_COLLEGE"]){
   expect(component).toContain(flag);
   expect(model.safeParse({jobId:"11111111-1111-4111-8111-111111111111",flag}).success).toBe(true);
  }
  for(const submittedWithin of ["LAST_7_DAYS","LAST_30_DAYS"]){
   expect(component).toContain(submittedWithin);
   expect(model.safeParse({jobId:"11111111-1111-4111-8111-111111111111",submittedWithin}).success).toBe(true);
  }
 });
 it("TPO-drive-workspace-72 collapses mobile actions and filters",()=>{
  const spreadsheet=source("src/components/tpo/tpo-applications-spreadsheet.tsx");
  expect(spreadsheet).toContain("<TpoGridFilterPanel fields={filters} mobileSheet/>");
  expect(spreadsheet).toContain("mobileActionsCollapsible storageKey=");
  const base=source("src/components/tpo/tpo-spreadsheet-grid.tsx");
  expect(base).toContain('md:hidden');
  expect(base).toContain(">Actions</summary>");
 });
});
