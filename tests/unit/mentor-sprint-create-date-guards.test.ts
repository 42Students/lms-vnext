import {describe,expect,it} from "vitest";
import {mentorSprintCreateSchema} from
 "@/modules/projects/mentor-sprint-write-model";
const valid={
 releaseId:"11111111-1111-4111-8111-111111111111",
 title:"Sprint 3",description:null,goal:null,definitionOfDone:null,
 startDate:"2026-10-30",endDate:"2026-11-06",dueDate:"2026-11-06",
};
describe("Mentor sprint planning date invariants",()=>{
 it("accepts a weekly plan that crosses a month boundary",()=>{
  expect(mentorSprintCreateSchema.safeParse(valid).success).toBe(true);
 });
 it("rejects a due date before the recorded sprint start via direct API",()=>{
  const result=mentorSprintCreateSchema.safeParse({...valid,dueDate:"2026-10-29"});
  expect(result.success).toBe(false);
 });
 it("rejects reversed sprint windows even without a UI",()=>{
  expect(mentorSprintCreateSchema.safeParse({...valid,endDate:"2026-10-29"}).success)
   .toBe(false);
 });
 it("permits unplanned dates and a due date beyond the planning window",()=>{
  expect(mentorSprintCreateSchema.safeParse({...valid,
   startDate:null,endDate:null,dueDate:null}).success).toBe(true);
  expect(mentorSprintCreateSchema.safeParse({...valid,
   dueDate:"2026-11-07"}).success).toBe(true);
 });
});
