import {describe,it,expect} from "vitest";
import {resolveLearnerCourseTypeFilter} from "@/modules/courses/learner-course-type-availability-model";
describe("learner Course type filter refreshed from scoped enrollments",()=>{
 it("restores All as the selected visual option when electives are gone",()=>{
  const selected=resolveLearnerCourseTypeFilter("elective",4,0);
  expect(selected).toBe("all");
  expect(selected==="elective").toBe(false);
 });
});
