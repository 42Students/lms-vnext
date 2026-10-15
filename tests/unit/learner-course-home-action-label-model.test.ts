import {describe,expect,it} from "vitest";
import {learnerCourseHomeActionLabel} from "@/modules/courses/learner-course-home-action-label-model";
describe("learner Course Home action heading",()=>{
 const base={readOnly:false,priorityType:null,overdue:false,hasNext:true,hasTrackable:true} as const;
 it("identifies actionable late submissions instead of announcing Due soon",()=>{
  expect(learnerCourseHomeActionLabel({...base,priorityType:"Assignment",overdue:true})).toBe("Overdue assignment");
 });
 it("never suggests actionable due work on a read-only historical Course",()=>{
  expect(learnerCourseHomeActionLabel({...base,readOnly:true,priorityType:"Quiz"})).toBe("Past semester");
 });
 it("distinguishes live sessions and ordinary continue steps",()=>{
  expect(learnerCourseHomeActionLabel({...base,priorityType:"Live Session"})).toBe("Upcoming live session");
  expect(learnerCourseHomeActionLabel(base)).toBe("Next up");
 });
});
