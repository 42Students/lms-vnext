import {describe,it,expect} from "vitest";
import {learnerAssessmentActiveCourse} from "@/modules/courses/learner-assessment-active-course-model";
describe("learner global assessments Course selection",()=>{
 it("retains an authorized course but clears an obsolete selection",()=>{
  const courses=[{id:"course-1"},{id:"course-2"}];
  expect(learnerAssessmentActiveCourse("course-2",courses)).toBe("course-2");
  expect(learnerAssessmentActiveCourse("removed",courses)).toBe("");
 });
 it("stays in all-courses mode when no courses are authorized",()=>{
  expect(learnerAssessmentActiveCourse("",[])).toBe("");
  expect(learnerAssessmentActiveCourse("foreign",[])).toBe("");
 });
});
