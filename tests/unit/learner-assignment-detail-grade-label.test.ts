import {describe,it,expect} from "vitest";
import {learnerAssignmentPublishedGradeLabel} from "@/modules/courses/learner-assignment-grade-label-model";
describe("standalone Assignment published grade",()=>{
 it("preserves genuine scored zero",()=>{
  expect(learnerAssignmentPublishedGradeLabel(0,10)).toContain("0/10");
 });
 it("never fabricates a zero when marks were not persisted",()=>{
  expect(learnerAssignmentPublishedGradeLabel(null,10)).toBe("Graded · score unavailable");
 });
});
