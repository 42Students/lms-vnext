import { describe, expect, it } from "vitest";
import {
  facultyQuizResultsCommandSchema,
  facultyQuizResultsTransition,
} from "@/modules/courses/faculty-quiz-results-command-model";
import {
  facultyAssignmentGradingAllowed,
  facultyAssignmentGradePublicationAllowed,
} from "@/modules/courses/faculty-assignment-grading-policy";
import { facultyGradeEditorState } from "@/modules/courses/faculty-grade-editor-model";
import { facultyGradeHasChanges } from "@/modules/courses/faculty-grade-noop-model";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const beforeDue = new Date("2099-01-05T09:59:59.999Z");
const due = new Date("2099-01-05T10:00:00.000Z");
const afterDue = new Date("2099-01-05T10:00:00.001Z");

describe("FAC-QUIZ-RESULTS-STATE-01 exact publication transition matrix", () => {
  it("never releases a draft, re-releases an already published grade or hides already private results", () => {
    for (const status of ["DRAFT", "ARCHIVED"]) {
      for (const action of ["PUBLISH", "HIDE"] as const) {
        expect(facultyQuizResultsTransition(status, false, action, due, afterDue))
          .toBe(false);
      }
    }
    expect(facultyQuizResultsTransition("CLOSED", true, "PUBLISH", due, afterDue)).toBe(false);
    expect(facultyQuizResultsTransition("CLOSED", false, "HIDE", due, afterDue)).toBe(false);
  });

  it("permits an explicit post-deadline release or hide only when it changes saved visibility", () => {
    expect(facultyQuizResultsTransition("PUBLISHED", false, "PUBLISH", due, beforeDue))
      .toBe(false);
    expect(facultyQuizResultsTransition("PUBLISHED", false, "PUBLISH", due, due))
      .toBe(true);
    expect(facultyQuizResultsTransition("PUBLISHED", true, "HIDE", due, afterDue))
      .toBe(true);
    expect(facultyQuizResultsTransition("PUBLISHED", false, "PUBLISH", null, afterDue))
      .toBe(false);
    expect(facultyQuizResultsTransition("CLOSED", false, "PUBLISH", null, beforeDue))
      .toBe(true);
    expect(facultyQuizResultsTransition("CLOSED", true, "HIDE", null, beforeDue))
      .toBe(true);
  });

  it("refuses unconfirmed, malformed or forged quiz results write commands", () => {
    const valid = {
      deliveryId,
      action: "PUBLISH",
      expectedUpdatedAt: "2099-01-04T10:00:00.000Z",
      confirmed: true,
    };
    expect(facultyQuizResultsCommandSchema.safeParse(valid).success).toBe(true);
    for (const invalid of [
      { ...valid, deliveryId: "foreign" },
      { ...valid, confirmed: false },
      { ...valid, action: "REOPEN" },
      { ...valid, collegeId: "forged" },
      { ...valid, expectedUpdatedAt: "yesterday" },
    ]) expect(facultyQuizResultsCommandSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("FAC-ASSIGNMENT-GRADE-STATE-01 strict scored and published grading", () => {
  it("rejects fractional, negative, overflowing and not-yet-published assignment marks", () => {
    expect(facultyAssignmentGradingAllowed("PUBLISHED", 0, 10)).toBe(true);
    expect(facultyAssignmentGradingAllowed("PUBLISHED", 10, 10)).toBe(true);
    for (const [status, earned, possible] of [
      ["DRAFT", 1, 10],
      ["CLOSED", 1, 10],
      ["PUBLISHED", -1, 10],
      ["PUBLISHED", 11, 10],
      ["PUBLISHED", 2.5, 10],
      ["PUBLISHED", 4, Number.POSITIVE_INFINITY],
    ] as const) {
      expect(facultyAssignmentGradingAllowed(status, earned, possible)).toBe(false);
    }
    expect(facultyAssignmentGradePublicationAllowed("PUBLISHED", "GRADED")).toBe(true);
    expect(facultyAssignmentGradePublicationAllowed("DRAFT", "GRADED")).toBe(false);
    expect(facultyAssignmentGradePublicationAllowed("PUBLISHED", "UNGRADED")).toBe(false);
  });

  it("never interprets an empty or malformed score field as earned zero", () => {
    const saved = {
      gradingStatus: "GRADED", pointsAwarded: 8,
      feedback: "Reviewed", gradePublished: false,
    };
    expect(facultyGradeEditorState(saved, "", "Reviewed", 10))
      .toMatchObject({ points: null, hasChanges: true, canPublish: false });
    expect(facultyGradeEditorState(saved, "2.5", "Reviewed", 10))
      .toMatchObject({ points: null, canPublish: false });
    expect(facultyGradeEditorState(saved, "-1", "Reviewed", 10))
      .toMatchObject({ points: null, canPublish: false });
    expect(facultyGradeEditorState(saved, "8", "Reviewed", 10))
      .toMatchObject({ points: 8, hasChanges: false, canPublish: true });
    expect(facultyGradeEditorState(saved, "8", "New feedback", 10))
      .toMatchObject({ points: 8, hasChanges: true, canPublish: false });
  });

  it("allows saved publication only after completed grading and blocks duplicate publication", () => {
    const state = {
      gradingStatus: "GRADED", pointsAwarded: 5, feedback: null,
      gradePublished: true,
    };
    expect(facultyGradeEditorState(state, "5", "", 10).canPublish).toBe(false);
    const ungraded = { ...state, gradingStatus: "UNGRADED", gradePublished: false };
    expect(facultyGradeEditorState(ungraded, "5", "", 10).canPublish).toBe(false);
    expect(facultyGradeHasChanges(
      { gradingStatus: "GRADED", pointsAwarded: 5, feedback: "Feedback" },
      { pointsAwarded: 5, feedback: "Feedback   " },
    )).toBe(false);
  });
});
