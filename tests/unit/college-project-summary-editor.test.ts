import {describe,expect,it} from "vitest";
import {collegeProjectStatusChangeAllowed,collegeProjectSummaryPatch} from "@/modules/projects/college-project-summary-model";
describe("COL-projects-02 persisted workspace summary fields",()=>{
 it("updates title/summary and permits only valid lifecycle transitions",()=>{
  const input={title:"Sample",summary:null,status:"ACTIVE",
   expectedTitle:"Prior",expectedSummary:"Text",expectedStatus:"PLANNED"};
  expect(collegeProjectSummaryPatch.safeParse(input).success).toBe(true);
  expect(collegeProjectStatusChangeAllowed("PLANNED","ACTIVE",false,false)).toBe(false);
  expect(collegeProjectStatusChangeAllowed("PLANNED","ACTIVE",true,false)).toBe(true);
  expect(collegeProjectStatusChangeAllowed("ACTIVE","COMPLETED",true,false)).toBe(false);
  expect(collegeProjectStatusChangeAllowed("ACTIVE","COMPLETED",true,true)).toBe(true);
  expect(collegeProjectStatusChangeAllowed("COMPLETED","PLANNED",true,true)).toBe(false);
 });
});
