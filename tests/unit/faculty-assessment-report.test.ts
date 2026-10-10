import { describe, expect, it } from "vitest";
import {
  assignmentScoreSummary,
  buildScoreDistribution,
  latestQuizAttemptsByLearner,
  questionAccuracy,
  scoreSummary,
} from "@/modules/courses/faculty-assessment-report-service";

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
  it("ignores corrupted scores, negative grades and non-finite percentages", () => {
    expect(scoreSummary([
      { score: 9, maxScore: 10 },
      { score: -1, maxScore: 10 },
      { score: 11, maxScore: 10 },
      { score: Number.POSITIVE_INFINITY, maxScore: 10 },
      { score: 2, maxScore: Number.NaN },
    ])).toEqual({ attempted: 5, graded: 1, averagePercent: 90 });
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


describe("W02 Faculty assessment legacy report analytics", () => {
  it("uses only each learner's latest quiz attempt, with attempt number as exact-time tiebreaker", () => {
    const attempts = [
      { membershipId: "a", submittedAt: new Date("2026-10-10T10:00:00Z"), attemptNumber: 1, score: 4 },
      { membershipId: "a", submittedAt: new Date("2026-10-10T11:00:00Z"), attemptNumber: 2, score: 8 },
      { membershipId: "b", submittedAt: new Date("2026-10-10T12:00:00Z"), attemptNumber: 1, score: 5 },
      { membershipId: "b", submittedAt: new Date("2026-10-10T12:00:00Z"), attemptNumber: 2, score: 7 },
    ];
    expect(
      latestQuizAttemptsByLearner(attempts)
        .map((row) => [row.membershipId, row.attemptNumber, row.score]),
    ).toEqual([
      ["a", 2, 8],
      ["b", 2, 7],
    ]);
  });

  it("uses the exact legacy 90/80/70/60/below-60 score buckets", () => {
    expect(buildScoreDistribution([100, 90, 89, 80, 79, 70, 69, 60, 59, 0]))
      .toEqual([
        { label: "90-100%", min: 90, max: 100, count: 2 },
        { label: "80-89%", min: 80, max: 89, count: 2 },
        { label: "70-79%", min: 70, max: 79, count: 2 },
        { label: "60-69%", min: 60, max: 69, count: 2 },
        { label: "Below 60%", min: 0, max: 59, count: 2 },
      ]);
  });

  it("sorts question accuracy worst-first and leaves unanswered questions last", () => {
    const questions = [
      { id: "q1", prompt: "Easy", points: 1 },
      { id: "q2", prompt: "Hard", points: 1 },
      { id: "q3", prompt: "No data", points: 1 },
    ];
    const attempts = [
      { answers: [
        { questionId: "q1", correct: true },
        { questionId: "q2", correct: false },
      ] },
      { answers: [
        { questionId: "q1", correct: true },
        { questionId: "q2", correct: true },
      ] },
    ];
    expect(questionAccuracy(questions, attempts).map((row) => [
      row.id, row.accuracyPercent, row.correctCount, row.answeredCount,
    ])).toEqual([
      ["q2", 50, 1, 2],
      ["q1", 100, 2, 2],
      ["q3", null, 0, 0],
    ]);
  });

  it("builds Assignment average/distribution from valid graded scores only", () => {
    expect(assignmentScoreSummary([
      { gradingStatus: "GRADED", pointsAwarded: 10 },
      { gradingStatus: "GRADED", pointsAwarded: 8 },
      { gradingStatus: "NOT_GRADED", pointsAwarded: null },
      { gradingStatus: "GRADED", pointsAwarded: 20 },
    ], 10)).toEqual({
      averagePercent: 90,
      distribution: [
        { label: "90-100%", min: 90, max: 100, count: 1 },
        { label: "80-89%", min: 80, max: 89, count: 1 },
        { label: "70-79%", min: 70, max: 79, count: 0 },
        { label: "60-69%", min: 60, max: 69, count: 0 },
        { label: "Below 60%", min: 0, max: 59, count: 0 },
      ],
    });
  });
});
