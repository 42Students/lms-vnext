import {
  describe,
  expect,
  it,
} from "vitest";
import {
  assignmentInteractionState,
  quizInteractionState,
  resourceInteractionState,
  isQuizExpired,
  lessonProgressState,
} from "@/components/courses/learner-interaction-model";

describe("learner Course interaction model", () => {
  it("never offers assignment submission after submission or a missed deadline", () => {
    expect(
      assignmentInteractionState({
        submissionId: null,
        progressStatus: "NOT_STARTED",
      }),
    ).toMatchObject({
      canSubmit: true,
      submitted: false,
      missed: false,
    });

    expect(
      assignmentInteractionState({
        submissionId:
          "00000000-0000-4000-8000-000000000001",
        progressStatus: "COMPLETED",
      }).canSubmit,
    ).toBe(false);

    expect(
      assignmentInteractionState({
        submissionId: null,
        progressStatus: "MISSED",
      }).canSubmit,
    ).toBe(false);
  });

  it("keeps retakes open only while a published quiz has attempts remaining", () => {
    expect(
      quizInteractionState({
        status: "PUBLISHED",
        attemptsUsed: 1,
        attemptsRemaining: 1,
        resultsPublished: false,
        progressStatus: "COMPLETED",
      }),
    ).toMatchObject({
      canAttempt: true,
      canReviewResults: false,
      exhausted: false,
    });

    expect(
      quizInteractionState({
        status: "PUBLISHED",
        attemptsUsed: 2,
        attemptsRemaining: 0,
        resultsPublished: false,
        progressStatus: "COMPLETED",
      }),
    ).toMatchObject({
      canAttempt: false,
      exhausted: true,
    });
  });

  it("never reopens a closed quiz and exposes review only after published results exist", () => {
    expect(
      quizInteractionState({
        status: "CLOSED",
        attemptsUsed: 1,
        attemptsRemaining: 0,
        resultsPublished: false,
        progressStatus: "COMPLETED",
      }),
    ).toMatchObject({
      canAttempt: false,
      canReviewResults: false,
      waitingForResults: true,
    });

    expect(
      quizInteractionState({
        status: "CLOSED",
        attemptsUsed: 1,
        attemptsRemaining: 0,
        resultsPublished: true,
        progressStatus: "COMPLETED",
      }),
    ).toMatchObject({
      canAttempt: false,
      canReviewResults: true,
      waitingForResults: false,
    });
  });

  it("allows manual completion only for accessible external resources", () => {
    expect(
      resourceInteractionState({
        type: "RESOURCE",
        externalUrl:
          "https://example.com/notes",
        progressStatus: "NOT_STARTED",
      }).canMarkComplete,
    ).toBe(true);

    expect(
      resourceInteractionState({
        type: "VIDEO",
        externalUrl:
          "https://example.com/video",
        progressStatus: "NOT_STARTED",
      }).canMarkComplete,
    ).toBe(false);

    expect(
      resourceInteractionState({
        type: "RESOURCE",
        externalUrl: null,
        progressStatus: "NOT_STARTED",
      }).canMarkComplete,
    ).toBe(false);
  });

  it("surfaces expired unattempted quizzes without mislabeling attempted quizzes", () => {
    const dueAt = new Date("2026-10-05T10:00:00.000Z");
    const now = new Date("2026-10-05T10:05:00.000Z").getTime();

    expect(isQuizExpired(0, dueAt, now)).toBe(true);
    expect(isQuizExpired(1, dueAt, now)).toBe(false);
    expect(
      isQuizExpired(
        0,
        new Date("2026-10-05T10:10:00.000Z"),
        now,
      ),
    ).toBe(false);
  });

  it("derives completed, in-progress and current lesson states", () => {
    expect(
      lessonProgressState(
        ["COMPLETED", "IN_PROGRESS", "NOT_STARTED"],
        true,
      ),
    ).toMatchObject({
      completed: 1,
      total: 3,
      complete: false,
      inProgress: true,
      current: true,
    });

    expect(
      lessonProgressState(
        ["COMPLETED", "COMPLETED"],
        true,
      ),
    ).toMatchObject({
      completed: 2,
      total: 2,
      complete: true,
      inProgress: false,
      current: false,
    });
  });

});
