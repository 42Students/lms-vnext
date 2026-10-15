import { describe, expect, it } from "vitest";
import { learnerAssignmentPublishedGradeLabel } from "@/modules/courses/learner-assignment-grade-label-model";

describe("published learner assignment grade display",()=>{
 it("does not turn an unavailable score into zero",()=>{
  expect(learnerAssignmentPublishedGradeLabel(null,20)).toContain("unavailable");
  expect(learnerAssignmentPublishedGradeLabel(null,20)).not.toContain("0/20");
 });
 it("preserves an actual recorded zero",()=>{
  expect(learnerAssignmentPublishedGradeLabel(0,20)).toBe("Graded · 0/20");
 });
});
