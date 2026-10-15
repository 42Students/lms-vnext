import {describe,expect,it} from "vitest";
import {learnerCourseCardProgress} from "@/modules/courses/learner-course-card-progress-model";
describe("Learner Courses accessible progress",()=>{
 it("does not show 0% without a measured denominator",()=>{
  expect(learnerCourseCardProgress(0,0)).toBeNull();
  expect(learnerCourseCardProgress(null,4)).toBeNull();
  expect(learnerCourseCardProgress(NaN,4)).toBeNull();
 });
 it("preserves measured zero and clamps impossible upstream values",()=>{
  expect(learnerCourseCardProgress(0,4)).toBe(0);
  expect(learnerCourseCardProgress(-5,2)).toBe(0);
  expect(learnerCourseCardProgress(175,2)).toBe(100);
 });
});
