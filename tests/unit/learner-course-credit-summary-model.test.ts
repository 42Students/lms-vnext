import { describe, expect, it } from "vitest";
import { learnerCourseCreditSummary } from "@/modules/courses/learner-course-credit-summary-model";

describe("learner recorded course credit summary", () => {
  it("preserves legitimate zero-credit courses", () => {
    expect(learnerCourseCreditSummary([0, 3])).toEqual({
      credits: 3, recordedCount: 2, missingCount: 0,
    });
  });
  it("does not fabricate unknown or invalid credit values", () => {
    expect(learnerCourseCreditSummary([null, Number.NaN, 2, -1])).toEqual({
      credits: 2, recordedCount: 1, missingCount: 3,
    });
  });
});
