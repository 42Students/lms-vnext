import {describe,expect,it} from "vitest";
import {collegeProjectStatusChangeAllowed,collegeProjectSummaryPatch} from "@/modules/projects/college-project-summary-model";
describe("COL-projects-02 persisted workspace summary fields",()=>{
 it("updates title/summary and permits only valid lifecycle transitions",()=>{
  const input={title:"Sample",summary:null,status:"ACTIVE",
   progressPercent:0,phase:null,dueLabel:null,courseLabel:null,sectionId:null,
   blocker:null,nextAction:null,startDate:null,endDate:null,sprintLengthWeeks:null,estimationUnit:null,
   expectedTitle:"Prior",expectedSummary:"Text",expectedStatus:"PLANNED",
   expectedUpdatedAt:"2026-01-01T00:00:00.000Z"};
  expect(collegeProjectSummaryPatch.safeParse(input).success).toBe(true);
  expect(collegeProjectSummaryPatch.safeParse({...input,endDate:"2026-01-01",startDate:"2026-02-01"}).success).toBe(false);
  expect(collegeProjectStatusChangeAllowed("PLANNED","ACTIVE",false,false)).toBe(false);
  expect(collegeProjectStatusChangeAllowed("PLANNED","ACTIVE",true,false)).toBe(true);
  expect(collegeProjectStatusChangeAllowed("ACTIVE","COMPLETED",true,false)).toBe(false);
  expect(collegeProjectStatusChangeAllowed("ACTIVE","COMPLETED",true,true)).toBe(true);
  expect(collegeProjectStatusChangeAllowed("COMPLETED","PLANNED",true,true)).toBe(false);
 });
});
