import {describe,it,expect} from "vitest";
import {learnerCourseCardNextLabel} from "@/modules/courses/learner-course-card-next-label-model";
const base={readOnly:false,learningPathReady:true,nextItem:null,summary:{itemsCompleted:1,itemsTotal:3}};
describe("learner Course next-action label",()=>{
 it("never calls incomplete or missed course work complete",()=>{
  expect(learnerCourseCardNextLabel(base)).toBe("Review remaining course work");
 });
 it("prioritizes overdue assignment and preserves read-only status",()=>{
  const overdue={...base,firstOverdue:{title:"Report"}};
  expect(learnerCourseCardNextLabel(overdue)).toContain("Overdue assignment");
  expect(learnerCourseCardNextLabel({...overdue,readOnly:true})).toBe("View course");
 });
 it("distinguishes empty, complete, and unpublished paths",()=>{
  expect(learnerCourseCardNextLabel({...base,summary:{itemsCompleted:0,itemsTotal:0}})).toBe("No learning items yet");
  expect(learnerCourseCardNextLabel({...base,summary:{itemsCompleted:3,itemsTotal:3}})).toBe("Course work complete");
  expect(learnerCourseCardNextLabel({...base,learningPathReady:false})).toBe("Learning path not published");
 });
});
