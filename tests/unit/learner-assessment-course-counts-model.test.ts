import {describe,it,expect} from "vitest";
import {learnerAssessmentCourseCounts} from "@/modules/courses/learner-assessment-course-counts-model";
describe("learner aggregate assessment course counts",()=>{
 it("counts provided authorized items without fetching other courses",()=>{
  const result=learnerAssessmentCourseCounts([{courseId:"A"},{courseId:"A"},{courseId:"B"}]);
  expect(result.get("A")).toBe(2);
  expect(result.get("B")).toBe(1);
  expect(result.get("FOREIGN")).toBeUndefined();
 });
 it("does not invent counts for a course with no published items",()=>{
  expect(learnerAssessmentCourseCounts([]).size).toBe(0);
 });
});
