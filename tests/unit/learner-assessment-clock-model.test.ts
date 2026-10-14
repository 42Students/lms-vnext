import { describe, expect, it } from "vitest";
import { learnerAssessmentClock } from "@/modules/courses/learner-assessment-clock-model";
import { quizOverviewActionState } from "@/components/courses/quiz-overview-state";
import { learnerQuizMobileState } from "@/modules/courses/learner-quiz-mobile-model";
import { assignmentOverviewState } from "@/modules/courses/learner-assignment-display";
describe("one snapshot-anchored assessment clock", () => {
  it("changes quiz action and mobile availability together after the deadline", () => {
    const snapshot = Date.parse("2026-10-14T10:00:00Z");
    const quiz = { status: "PUBLISHED" as const, dueAt: "2026-10-14T10:00:01Z",
      attemptsUsed: 0, attemptsRemaining: 2, maxAttempts: 2, resultsPublished: false,
      progressStatus: "NOT_STARTED" as const };
    expect(quizOverviewActionState(quiz, learnerAssessmentClock(snapshot, 0)).action).toBe("Start Quiz");
    const now = learnerAssessmentClock(snapshot, 1001);
    expect(quizOverviewActionState(quiz, now)).toMatchObject({ review: true, label: "Missed" });
    expect(learnerQuizMobileState(quiz, now).label).toBe("Closed");
    expect(quiz.resultsPublished).toBe(false);
  });
  it("keeps late assignment submission allowed when the clock passes its deadline", () => {
    const now = learnerAssessmentClock(Date.parse("2026-10-14T10:00:00Z"), 2000);
    expect(assignmentOverviewState({ dueAt: "2026-10-14T10:00:01Z", submittedAt: null,
      pointsAwarded: null, maxPoints: 10, gradePublished: false }, now)).toMatchObject({ action: "Submit", label: "Overdue · late submission allowed" });
  });
  it("rejects invalid or backward elapsed time without reading the device clock", () => {
    expect(learnerAssessmentClock(1000, -10)).toBe(1000);
    expect(learnerAssessmentClock(1000, NaN)).toBe(1000);
    expect(learnerAssessmentClock(1000, Infinity)).toBe(1000);
    expect(learnerAssessmentClock(1000, 1500)).toBe(2500);
  });
});
