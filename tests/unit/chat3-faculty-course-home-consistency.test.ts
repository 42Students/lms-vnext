import { describe, expect, it } from "vitest";
import { buildFacultyCourseHomeSignals } from "@/modules/courses/faculty-course-home-model";

const now = new Date("2099-06-01T12:00:00.000Z");
const roster = [
  { membershipId: "m1", displayName: "Asha", email: null },
  { membershipId: "m2", displayName: "Bala", email: null },
];
const session = (id: string, status: string | null = "MARKED") => ({
  id, attendanceStatus: status, startsAt: new Date("2099-05-01T10:00:00Z"),
});
const assignment = (id: string, status: string, dueAt: Date | null,
  submissions: Array<{ membershipId: string; gradingStatus: string; pointsAwarded: number | null }> = []) => ({
  id, status, dueAt, submissions, lessonId: "lesson", title: id, maxPoints: 10,
});

describe("FAC-COURSE-HOME-01 current Faculty roster and published-score integrity", () => {
  it("counts a duplicated persisted roster membership once in attendance denominator and attention totals", () => {
    const input = {
      roster: [roster[0]!, roster[0]!, roster[1]!],
      attendanceSessions: [session("s1"), session("s1"), session("s2")],
      attendanceRecords: [
        { scheduleEventId: "s1", membershipId: "m1", status: "ABSENT" },
        { scheduleEventId: "s1", membershipId: "m1", status: "ABSENT" },
        { scheduleEventId: "s2", membershipId: "m1", status: "ABSENT" },
        { scheduleEventId: "s1", membershipId: "foreign", status: "ABSENT" },
      ],
      assignments: [] as ReturnType<typeof assignment>[],
    };
    const before = [...input.roster];
    const result = buildFacultyCourseHomeSignals(input, now);
    expect(result.attendance.markedSessions).toBe(2);
    expect(result.attendance.averagePercent).toBe(50);
    expect(result.attendance.lowAttendance).toEqual([
      expect.objectContaining({ membershipId: "m1", absentCount: 2, attendancePercent: 0 }),
    ]);
    expect(result.atRiskTotal).toBe(1);
    expect(input.roster).toEqual(before);
  });

  it("does not include drafts, archived grades or out-of-roster submissions in Section analytics", () => {
    const result = buildFacultyCourseHomeSignals({
      roster,
      attendanceSessions: [],
      attendanceRecords: [],
      assignments: [
        assignment("published", "PUBLISHED", null, [
          { membershipId: "m1", gradingStatus: "GRADED", pointsAwarded: 8 },
          { membershipId: "foreign", gradingStatus: "GRADED", pointsAwarded: 10 },
        ]),
        assignment("draft", "DRAFT", null, [
          { membershipId: "m1", gradingStatus: "GRADED", pointsAwarded: 0 },
        ]),
        assignment("archived", "ARCHIVED", null, [
          { membershipId: "m1", gradingStatus: "GRADED", pointsAwarded: 0 },
        ]),
      ],
    }, now);
    expect(result.performance.studentAverages).toEqual([
      expect.objectContaining({ membershipId: "m1", averagePercent: 80 }),
    ]);
    expect(result.performance.averagePercent).toBe(80);
  });

  it("does not mark submissions missing when imported deadlines are invalid or future", () => {
    const result = buildFacultyCourseHomeSignals({
      roster, attendanceSessions: [], attendanceRecords: [],
      assignments: [
        assignment("invalid", "PUBLISHED", new Date("invalid")),
        assignment("future", "PUBLISHED", new Date("2099-07-01T12:00:00Z")),
        assignment("past", "PUBLISHED", new Date("2099-05-01T12:00:00Z")),
      ],
    }, now);
    expect(result.atRiskTotal).toBe(0);
    expect(result.atRisk).toHaveLength(0);
  });

  it("caps risk preview without losing the true total after duplicate roster rows are normalized", () => {
    const ten = Array.from({ length: 10 }, (_, index) => ({
      membershipId: "r" + index, displayName: "Learner " + index, email: null,
    }));
    const result = buildFacultyCourseHomeSignals({
      roster: [ten[0]!, ...ten],
      attendanceSessions: [session("first"), session("second")],
      attendanceRecords: ten.flatMap(learner => [
        { scheduleEventId: "first", membershipId: learner.membershipId, status: "ABSENT" },
        { scheduleEventId: "second", membershipId: learner.membershipId, status: "ABSENT" },
      ]),
      assignments: [],
    }, now);
    expect(result.atRiskTotal).toBe(10);
    expect(result.atRisk).toHaveLength(8);
    expect(result.atRiskCounts.critical).toBe(10);
  });
});
