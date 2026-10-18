import { describe, expect, it } from "vitest";
import {
  facultySessionCoverage, facultySessionCoverageSchema,
} from "@/modules/courses/faculty-session-coverage-model";
import { facultyGradeEditorState } from "@/modules/courses/faculty-grade-editor-model";
import { facultyGradeHasChanges } from "@/modules/courses/faculty-grade-noop-model";
import { facultyRegradeFeedbackAllowed } from "@/modules/courses/faculty-regrade-feedback-model";
import {
  facultyAssessmentVisibleToDelivery, nextFacultyLessonContentSequence,
} from "@/modules/courses/faculty-assessment-batch-model";

const delivery = "11111111-1111-4111-8111-111111111111";
const sibling = "22222222-2222-4222-8222-222222222222";
const now = "2099-05-01T12:00:00.000Z";

describe("FAC-ATTENDANCE-GRADE-MODELS-01 Faculty-versus-Learner evidence projection", () => {
  it("gates Section attendance coverage by strict delivery selector", () => {
    expect(facultySessionCoverageSchema.safeParse({ deliveryId: delivery }).success).toBe(true);
    for (const selector of [
      { deliveryId: "bad" },
      { deliveryId: delivery, collegeId: sibling },
      { deliveryId: [delivery, sibling] },
    ]) {
      expect(facultySessionCoverageSchema.safeParse(selector).success).toBe(false);
    }
  });

  it("separates marked, overdue unmarked, upcoming and ongoing without mutating sessions", () => {
    const rows = [
      { id: "marked", title: "Past recorded", startsAt: "2099-04-01T10:00:00.000Z",
        endsAt: "2099-04-01T11:00:00.000Z", attendanceStatus: "MARKED" },
      { id: "ended", title: "Past unmarked", startsAt: "2099-04-02T10:00:00.000Z",
        endsAt: "2099-04-02T11:00:00.000Z", attendanceStatus: null },
      { id: "ongoing", title: "In session", startsAt: "2099-05-01T10:00:00.000Z",
        endsAt: "2099-05-01T13:00:00.000Z", attendanceStatus: null },
      { id: "future", title: "Upcoming", startsAt: "2099-05-02T10:00:00.000Z",
        endsAt: "2099-05-02T11:00:00.000Z", attendanceStatus: "UNMARKED" },
    ];
    const before = [...rows];
    const summary = facultySessionCoverage(rows, now);
    expect(summary).toMatchObject({
      total: 4, marked: 1, completedUnmarked: 1, upcoming: 1, omitted: 0,
    });
    expect(summary.shown.map(row => [row.id, row.label])).toEqual([
      ["future", "Upcoming"], ["ongoing", "In progress/unmarked"],
      ["ended", "Ended without marks"], ["marked", "Marked"],
    ]);
    expect(rows).toEqual(before);
    expect(facultySessionCoverage(Array.from({ length: 44 }, (_, i) => ({
      ...rows[0]!, id: "s" + i,
    })), now)).toMatchObject({ total: 44, omitted: 4 });
  });

  it("treats empty grade text as unknown, never zero, and permits publication only after persisted save", () => {
    const saved = {
      gradingStatus: "GRADED", pointsAwarded: 8, feedback: "Good work",
      gradePublished: false,
    };
    expect(facultyGradeEditorState(saved, "8", "Good work", 10)).toEqual({
      points: 8, hasChanges: false, canPublish: true,
    });
    expect(facultyGradeEditorState(saved, "", "Good work", 10)).toMatchObject({
      points: null, hasChanges: true, canPublish: false,
    });
    expect(facultyGradeEditorState(saved, "0", "Good work", 10)).toMatchObject({
      points: 0, hasChanges: true, canPublish: false,
    });
    for (const raw of ["-1", "1.5", "001", "11", "NaN", "999999"]) {
      expect(facultyGradeEditorState(saved, raw, "Good work", 10).points).toBeNull();
    }
    expect(facultyGradeEditorState({ ...saved, gradePublished: true }, "8", "Good work", 10).canPublish)
      .toBe(false);
  });

  it("requires explanation when changing learner-visible scores", () => {
    expect(facultyRegradeFeedbackAllowed(false, null)).toBe(true);
    expect(facultyRegradeFeedbackAllowed(true, null)).toBe(false);
    expect(facultyRegradeFeedbackAllowed(true, "  short  ")).toBe(false);
    expect(facultyRegradeFeedbackAllowed(true, "  Revised after review  ")).toBe(true);
    expect(facultyGradeHasChanges({
      gradingStatus: "GRADED", pointsAwarded: 5, feedback: "Note",
    }, { pointsAwarded: 5, feedback: "  Note " })).toBe(false);
    expect(facultyGradeHasChanges({
      gradingStatus: "NOT_GRADED", pointsAwarded: null, feedback: null,
    }, { pointsAwarded: 0, feedback: "" })).toBe(true);
  });

  it("allows shared and current Section assessment references, not sibling assignments", () => {
    expect(facultyAssessmentVisibleToDelivery({ deliveryId: null }, delivery)).toBe(true);
    expect(facultyAssessmentVisibleToDelivery({ deliveryId: delivery }, delivery)).toBe(true);
    expect(facultyAssessmentVisibleToDelivery({ deliveryId: sibling }, delivery)).toBe(false);
  });

  it("refuses invalid lesson sequences without array spreading into the JS argument limit", () => {
    expect(nextFacultyLessonContentSequence([])).toBe(0);
    expect(nextFacultyLessonContentSequence([0, 10, 4])).toBe(11);
    for (const sequence of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
      expect(() => nextFacultyLessonContentSequence([sequence]))
        .toThrow("INVALID_FACULTY_LESSON_SEQUENCE");
    }
    const many = Array.from({ length: 100000 }, (_, i) => i);
    expect(nextFacultyLessonContentSequence(many)).toBe(100000);
  });
});
