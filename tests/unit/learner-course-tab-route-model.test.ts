import { describe, expect, it } from "vitest";
import { learnerCourseTabPath } from "@/modules/courses/learner-course-tab-route-model";
describe("learner course tab routes",()=>{
 const tabs=["home","roadmap","attendanceDetail","discussions"];
 it("allows one existing tab",()=>{
  expect(learnerCourseTabPath(["roadmap"],tabs)).toBe("roadmap");
 });
 it("rejects nested, unknown, and empty tab paths",()=>{
  expect(learnerCourseTabPath(["home","unexpected"],tabs)).toBeNull();
  expect(learnerCourseTabPath(["invalid"],tabs)).toBeNull();
  expect(learnerCourseTabPath([],tabs)).toBeNull();
 });
});
