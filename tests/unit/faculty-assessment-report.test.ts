import { describe, expect, it } from "vitest";
import { scoreSummary } from "@/modules/courses/faculty-assessment-report-service";

describe("W02 Faculty Quiz Report score summary", () => {
  it("treats no valid attempts as unknown rather than a zero average", () => {
    expect(scoreSummary([])).toEqual({
      attempted: 0,
      graded: 0,
      averagePercent: null,
    });
    expect(scoreSummary([{ score: null, maxScore: null }])).toEqual({
      attempted: 1,
      graded: 0,
      averagePercent: null,
    });
  });
  it("uses each learner's own maximum score, excluding invalid zero maxima", () => {
    expect(scoreSummary([
      { score: 8, maxScore: 10 },
      { score: 10, maxScore: 20 },
      { score: null, maxScore: 10 },
      { score: 0, maxScore: 0 },
    ])).toEqual({
      attempted: 4,
      graded: 2,
      averagePercent: 65,
    });
  });
});
