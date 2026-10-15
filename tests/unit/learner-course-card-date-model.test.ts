import {describe,expect,it} from "vitest";
import {learnerCourseCardDate} from "@/modules/courses/learner-course-card-date-model";
describe("learner Course card date",()=>{
 it("converts an instant to IST",()=>{
  expect(learnerCourseCardDate("2026-10-15T23:45:00Z")).toContain("16 Oct 2026");
 });
 it("renders invalid/missing dates without throwing",()=>{
  expect(learnerCourseCardDate("not-a-date")).toBeNull();
  expect(learnerCourseCardDate(null)).toBeNull();
 });
});
