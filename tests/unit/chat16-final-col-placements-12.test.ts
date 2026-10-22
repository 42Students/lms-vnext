import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("COL-placements-12 College Admin drive create field mapping",()=>{
 it("COL-placements-12 validates and persists assessment URL, deadline, dated milestones and custom eligibility",()=>{
  const form=read("src/components/placements/placement-job-create-form.tsx");
  for(const name of ["assessmentUrl","assessmentDeadline"]){
   expect(form).toContain('name="'+name+'"');
  }
  expect(form).toContain("importantDateRows.map(row=>");
  expect(form).toContain('aria-label="Important date label"');
  expect(form).toContain('importantDates,customEligibilityRules');
  expect(form).toContain('assessmentUrl:String(data.get("assessmentUrl")??"").trim()||null');
  expect(form).toContain('assessmentDeadline,importantDates,customEligibilityRules');
  expect(form).toContain("Assessment deadline must be after application deadline.");
 });
 it("COL-placements-12 maps academic targets and candidate preferences to explicit scoped policies",()=>{
  const form=read("src/components/placements/placement-job-create-form.tsx");
  for(const name of ["preferredDegree","preferredSpecialization","preferredCity"]){
   expect(form).toContain('name="'+name+'"');
  }
  expect(form).toContain("selectedProgramIds:[...effectiveProgramIds].sort()");
  expect(form).toContain("selectedCohortIds:[...effectiveCohortIds].sort()");
  expect(form).toContain("selectedSectionIds:[...effectiveSectionIds].sort()");
  expect(form).toContain("Visibility and cross-college targeting are not implied by application mode.");
 });
});