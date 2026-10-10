import { describe, expect, it } from "vitest";
import { buildFacultyCourseHomeSignals } from "@/modules/courses/faculty-course-home-model";

const roster = Array.from({ length: 4 }, (_, index) => ({
  membershipId: `m${index + 1}`,
  displayName: `Learner ${index + 1}`,
  email: `l${index + 1}@example.test`,
}));

describe("W02 Faculty Course Home signals", () => {
  it("uses marked held sessions only and flags absence above the legacy 25% threshold", () => {
    const result = buildFacultyCourseHomeSignals({
      roster,
      attendanceSessions: [
        { id: "s1", startsAt: new Date("2026-10-01T04:00:00Z"), attendanceStatus: "MARKED" },
        { id: "s2", startsAt: new Date("2026-10-02T04:00:00Z"), attendanceStatus: "MARKED" },
        { id: "s3", startsAt: new Date("2026-10-03T04:00:00Z"), attendanceStatus: "MARKED" },
        { id: "s4", startsAt: new Date("2026-10-04T04:00:00Z"), attendanceStatus: "MARKED" },
        { id: "unmarked", startsAt: new Date("2026-10-05T04:00:00Z"), attendanceStatus: "UNMARKED" },
        { id: "future", startsAt: new Date("2026-11-01T04:00:00Z"), attendanceStatus: null },
      ],
      attendanceRecords: [
        { scheduleEventId: "s1", membershipId: "m1", status: "ABSENT" },
        { scheduleEventId: "s2", membershipId: "m1", status: "ABSENT" },
        { scheduleEventId: "unmarked", membershipId: "m2", status: "ABSENT" },
      ],
      assignments: [],
    }, new Date("2026-10-10T00:00:00Z"));
    expect(result.attendance.markedSessions).toBe(4);
    expect(result.attendance.averagePercent).toBe(88);
    expect(result.attendance.lowAttendance).toEqual([
      expect.objectContaining({ membershipId: "m1", attendancePercent: 50 }),
    ]);
  });

  it("counts pending grading and only 2+ overdue missing assignments as at-risk", () => {
    const result = buildFacultyCourseHomeSignals({
      roster,
      attendanceSessions: [],
      attendanceRecords: [],
      assignments: [
        {
          id: "a1", lessonId: "l1", title: "Past 1",
          dueAt: new Date("2026-10-01T00:00:00Z"), maxPoints: 10, status: "PUBLISHED",
          submissions: [
            { membershipId: "m1", gradingStatus: "NOT_GRADED", pointsAwarded: null },
            { membershipId: "m2", gradingStatus: "GRADED", pointsAwarded: 8 },
          ],
        },
        {
          id: "a2", lessonId: "l1", title: "Past 2",
          dueAt: new Date("2026-10-02T00:00:00Z"), maxPoints: 10, status: "PUBLISHED",
          submissions: [
            { membershipId: "m2", gradingStatus: "GRADED", pointsAwarded: 10 },
          ],
        },
        {
          id: "future", lessonId: "l1", title: "Future",
          dueAt: new Date("2026-11-02T00:00:00Z"), maxPoints: 10, status: "PUBLISHED",
          submissions: [],
        },
      ],
    }, new Date("2026-10-10T00:00:00Z"));
    expect(result.pendingSubmissions).toHaveLength(1);
    expect(result.atRisk.map((row) => [row.membershipId, row.reasons]))
      .toEqual([
        ["m3", ["2 submissions missing"]],
        ["m4", ["2 submissions missing"]],
      ]);
    expect(result.performance.averagePercent).toBe(90);
  });
});
