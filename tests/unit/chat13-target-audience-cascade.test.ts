import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const get=(p:string)=>readFileSync(p,"utf8");
describe("Drive Target Audience Department Program Batch Class",()=>{
 it("SA-placements-projects-14 scopes class choices by department and persists section whitelist",()=>{
  const ws=get("src/components/placements/placement-job-create-workspace.tsx");
  expect(ws).toContain('eq(departments.collegeId,collegeId)');
  expect(ws).toContain('eq(sections.status,"ACTIVE")');
  expect(ws).toContain("sections:sectionRows");
  const form=get("src/components/placements/placement-job-create-form.tsx");
  expect(form).toContain("Department · Target Audience");
  expect(form).toContain("Classes (sections)");
  expect(form).toContain("allowedSectionIds:selectedSectionIds");
  expect(form).toContain("effectiveProgramIds");
  expect(form).toContain("selectedSectionIds:[...selectedSectionIds]");
 });
});
