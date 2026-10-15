import {describe,expect,it} from "vitest";
import {selectLearnerOverdueAssignment} from "@/modules/courses/learner-course-overdue-link-model";
describe("course card overdue jump",()=>{
 it("selects oldest real overdue unsubmitted assignment",()=>{
  const due=new Date("2026-10-13T10:00:00Z");
  const row=selectLearnerOverdueAssignment([
   {id:"lesson",assignments:[{id:"late",title:"Essay",dueAt:due,submittedAt:null},
    {id:"done",title:"Other",dueAt:due,submittedAt:new Date("2026-10-14T10:00:00Z")}]}],
   Date.parse("2026-10-15T10:00:00Z"));
  expect(row).toEqual({lessonId:"lesson",itemId:"late",title:"Essay"});
 });
 it("has no action when work is complete or time is not trusted",()=>{
  expect(selectLearnerOverdueAssignment([],Date.now())).toBeNull();
  expect(selectLearnerOverdueAssignment([],NaN)).toBeNull();
 });
});
