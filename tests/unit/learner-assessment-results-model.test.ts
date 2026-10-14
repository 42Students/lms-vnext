import { describe, expect, it } from "vitest";
import {
  buildLearnerAssessmentResults,
  filterLearnerAssessmentResults,
  learnerAssessmentResultsViewSchema,
  type LearnerAssessmentJourney,
} from "@/modules/placements/learner-assessment-results-model";

const source: LearnerAssessmentJourney = {
  applicationId: "app-1",
  job: { id: "job-1", title: "Engineer" },
  company: { name: "Acme" },
  results: [
    {
      resultId: "pass",
      roundKind: "TEST",
      roundName: "Aptitude",
      roundSequence: 1,
      outcome: "PASS",
      scorePercent: 86,
      candidateMessage: "Qualified",
      appliedAt: new Date("2026-10-13T10:00:00Z"),
    },
    {
      resultId: "fail",
      roundKind: "VENDOR_TEST",
      roundName: "Online test",
      roundSequence: 2,
      outcome: "FAIL",
      scorePercent: null,
      candidateMessage: null,
      appliedAt: new Date("2026-10-14T10:00:00Z"),
    },
    {
      resultId: "interview",
      roundKind: "INTERVIEW",
      roundName: "Technical interview",
      roundSequence: 3,
      outcome: "PASS",
      scorePercent: 92,
      candidateMessage: null,
      appliedAt: new Date("2026-10-15T10:00:00Z"),
    },
    {
      resultId: "staged",
      roundKind: "TEST",
      roundName: "Staged assessment",
      roundSequence: 4,
      outcome: "HOLD",
      scorePercent: null,
      candidateMessage: null,
      appliedAt: null,
    },
  ],
};

describe("Learner official assessment result projection", () => {
  it("includes only applied TEST/VENDOR_TEST outcomes with persisted fields", () => {
    const rows = buildLearnerAssessmentResults([source]);
    expect(rows.map((row) => row.resultId)).toEqual(["fail", "pass"]);
    expect(rows[0]).toMatchObject({
      companyName: "Acme",
      roleTitle: "Engineer",
      outcome: "FAIL",
      scorePercent: null,
    });
    expect(rows[1]?.candidateMessage).toBe("Qualified");
    expect(source.results).toHaveLength(4);
  });

  it("distinguishes no published assessment results from a filtered empty view", () => {
    expect(buildLearnerAssessmentResults([])).toEqual([]);
    const rows = buildLearnerAssessmentResults([source]);
    expect(filterLearnerAssessmentResults(rows, "other")).toEqual({
      counts: { all: 2, passed: 1, failed: 1, other: 0 },
      items: [],
    });
  });

  it("categorizes applied HOLD/ABSENT without claiming passed or failed", () => {
    const results = buildLearnerAssessmentResults([{
      ...source,
      results: [{
        ...source.results[0]!,
        outcome: "HOLD",
      }],
    }]);
    expect(filterLearnerAssessmentResults(results, "other").items).toHaveLength(1);
  });

  it("validates requested results view through Zod", () => {
    expect(learnerAssessmentResultsViewSchema.parse("passed")).toBe("passed");
    expect(learnerAssessmentResultsViewSchema.safeParse("other-learner").success).toBe(false);
  });
});
