import {describe,it,expect} from "vitest";
import {learnerAssignmentPublishedGradeLabel} from "@/modules/courses/learner-assignment-grade-label-model";
describe("learner assignment released score display",()=>{
 it("never turns unpublished or missing points into zero",()=>{
  expect(learnerAssignmentPublishedGradeLabel(null,100)).toBe("Graded · score unavailable");
 });
 it("preserves authentic scored-zero and nonzero grades",()=>{
  expect(learnerAssignmentPublishedGradeLabel(0,25)).toBe("Graded · 0/25");
  expect(learnerAssignmentPublishedGradeLabel(23,25)).toBe("Graded · 23/25");
 });
});
