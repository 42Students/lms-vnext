import { describe, expect, it } from "vitest";
import { learnerCourseTabPath } from "@/modules/courses/learner-course-tab-route-model";
describe("learner course tab routes",()=>{
 const tabs=["home","roadmap","attendanceDetail","discussions"];
 it("allows one existing tab",()=>{
  expect(learnerCourseTabPath(["roadmap"],tabs)).toBe("roadmap");
 });
 it("canonicalizes known nested tabs and rejects unknown or empty tab paths",()=>{
  expect(learnerCourseTabPath(["home","unexpected"],tabs)).toBe("home");
  expect(learnerCourseTabPath(["invalid","roadmap"],tabs)).toBeNull();
  expect(learnerCourseTabPath(["invalid"],tabs)).toBeNull();
  expect(learnerCourseTabPath([],tabs)).toBeNull();
 });
});
