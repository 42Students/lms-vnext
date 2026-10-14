import { describe, expect, it } from "vitest";
import {
  buildLearnerCourseAttendanceMonths,
  buildLearnerLessonProgress,
  learnerAttendanceMonthSchema,
} from "@/modules/courses/learner-course-drilldown-model";

describe("Own-course progress breakdown", () => {
  it("counts only completed persisted items, not grades or future intentions", () => {
    const result = buildLearnerLessonProgress([
      {
        id: "lesson-b", name: "Second", sequence: 2,
        items: [{ id: "b", title: "Quiz", kind: "QUIZ", progress: { status: "MISSED" } }],
      },
      {
        id: "lesson-a", name: "First", sequence: 1,
        items: [
          { id: "a", title: "Video", kind: "CONTENT", progress: { status: "COMPLETED" } },
          { id: "b", title: "Assignment", kind: "ASSIGNMENT", progress: { status: "IN_PROGRESS" } },
        ],
      },
    ]);
    expect(result.map((row) => row.id)).toEqual(["lesson-a", "lesson-b"]);
    expect(result[0]).toMatchObject({ total: 2, completed: 1, inProgress: 1, percentage: 50 });
    expect(result[1]).toMatchObject({ total: 1, completed: 0, missed: 1, percentage: 0 });
  });

  it("distinguishes unpublished learning content from 100% completion", () => {
    const result = buildLearnerLessonProgress([
      { id: "lesson", name: "Empty lesson", sequence: 0, items: [] },
    ]);
    expect(result[0]).toMatchObject({ total: 0, completed: 0, percentage: null });
    expect(buildLearnerLessonProgress([])).toEqual([]);
  });
});

describe("Learner course attendance month summaries", () => {
  const rows = [
    {
      id: "p", startsAt: new Date("2026-10-12T04:30:00Z"),
      title: "Present", status: "PRESENT" as const,
    },
    {
      id: "a", startsAt: new Date("2026-10-13T04:30:00Z"),
      title: "Absent", status: "ABSENT" as const,
    },
    {
      id: "u", startsAt: new Date("2026-10-14T04:30:00Z"),
      title: "Unmarked", status: "NOT_MARKED" as const,
    },
    {
      id: "s", startsAt: new Date("2026-10-20T04:30:00Z"),
      title: "Future scheduled", status: "SCHEDULED" as const,
    },
    {
      id: "prev", startsAt: new Date("2026-09-30T18:40:00Z"),
      title: "IST October", status: "PRESENT" as const,
    },
  ];
  it("uses Asia/Kolkata month boundaries and explicit held/marked denominators", () => {
    const summary = buildLearnerCourseAttendanceMonths(rows);
    expect(summary).toHaveLength(1);
    expect(summary[0]).toMatchObject({
      month: "2026-10",
      scheduled: 1,
      held: 4,
      marked: 3,
      notMarked: 1,
      present: 2,
      otherMarked: 1,
      percentage: 67,
    });
    expect(summary[0]?.records[0]?.id).toBe("s");
  });
  it("does not fabricate absences from scheduled or unmarked sessions", () => {
    const summary = buildLearnerCourseAttendanceMonths([
      { id: "future", startsAt: new Date("2026-12-01T04:30:00Z"), title: "Future", status: "SCHEDULED" },
      { id: "unknown", startsAt: new Date("2026-12-02T04:30:00Z"), title: "Unknown", status: "NOT_MARKED" },
    ]);
    expect(summary[0]).toMatchObject({
      marked: 0, present: 0, otherMarked: 0, percentage: null,
    });
    expect(buildLearnerCourseAttendanceMonths([])).toEqual([]);
  });
  it("validates month filters with Zod and rejects arbitrary query strings", () => {
    expect(learnerAttendanceMonthSchema.parse("2026-10")).toBe("2026-10");
    expect(learnerAttendanceMonthSchema.safeParse("2026-13").success).toBe(false);
    expect(learnerAttendanceMonthSchema.safeParse("2026-10/else").success).toBe(false);
  });
});
