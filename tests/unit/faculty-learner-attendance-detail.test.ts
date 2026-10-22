import { describe, expect, it } from "vitest";
import { facultyLearnerAttendanceDetail, facultyAttendanceMonthSummary, facultyAttendanceThresholdBreakdown } from "@/modules/attendance/faculty-learner-attendance-detail";

const session = (id: string, startsAt: string, status: string | null) => ({
  id, title: "Faculty class " + id, startsAt,
  endsAt: new Date(new Date(startsAt).getTime() + 3600000).toISOString(),
  attendanceStatus: status,
});
const NOW = new Date("2026-10-14T06:00:00.000Z");
describe("Faculty attendance learner detail (read-only)", () => {
  it("distinguishes present, absent, unknown and future without inflating eligibility", () => {
    const sessions = [
      session("p", "2026-10-10T03:00:00Z", "MARKED"),
      session("a", "2026-10-11T03:00:00Z", "MARKED"),
      session("u", "2026-10-12T03:00:00Z", null),
      session("f", "2026-10-15T03:00:00Z", null),
    ];
    const result = facultyLearnerAttendanceDetail("learner-A", sessions, [
      { scheduleEventId: "a", membershipId: "learner-A", status: "ABSENT", markedAt: "2026-10-11T05:00:00Z", note: "Excused by teacher" },
      { scheduleEventId: "p", membershipId: "learner-B", status: "ABSENT", markedAt: "2026-10-10T05:00:00Z", note: "Other learner" },
    ], NOW);
    expect(result).toMatchObject({
      present: 1, absent: 1, unmarked: 1, upcoming: 1,
      marked: 2, attendedPercent: 50,
    });
    expect(result.rows.map((row) => row.code)).toEqual(["S", "—", "A", "P"]);
    expect(result.rows[2]).toMatchObject({ note: "Excused by teacher", label: "Absent" });
    expect(result.rows[3]?.note).toBeNull();
  });

  it("returns unknown percentage when no session has been marked", () => {
    const result = facultyLearnerAttendanceDetail("student", [
      session("future", "2026-10-15T03:00:00Z", null),
      session("held", "2026-10-11T03:00:00Z", "UNMARKED"),
    ], [], NOW);
    expect(result).toMatchObject({
      present: 0, absent: 0, marked: 0, unmarked: 1,
      upcoming: 1, attendedPercent: null,
    });
  });

  it("treats an imported medical excusal as attended evidence, never an unexplained absence", () => {
    const result = facultyLearnerAttendanceDetail("student",
      [session("historic", "2026-10-08T03:00:00Z", null)],
      [{ scheduleEventId: "historic", membershipId: "student", status: "MEDICAL", note: "medical", markedAt: "2026-10-08T05:00:00Z" }],
      NOW,
    );
    expect(result).toMatchObject({ present: 1, absent: 0, marked: 1, attendedPercent: 100 });
    expect(result.rows[0]).toMatchObject({ code: "P", label: "Present", note: "medical" });
  });
});


describe("Faculty monthly class-health report", () => {
  it("excludes unmarked, future and out-of-roster historical marks", () => {
    const sessions = [
      session("marked", "2026-10-10T03:00:00Z", "MARKED"),
      session("unmarked", "2026-10-11T03:00:00Z", null),
      session("future", "2026-10-15T03:00:00Z", null),
    ];
    const records = [
      { scheduleEventId: "marked", membershipId: "A", status: "ABSENT", note: null, markedAt: "2026-10-10T05:00:00Z" },
      { scheduleEventId: "marked", membershipId: "historical", status: "ABSENT", note: null, markedAt: "2026-10-10T05:00:00Z" },
    ];
    const health = facultyAttendanceMonthSummary(["A", "B", "A"], sessions, records, NOW);
    expect(health).toMatchObject({
      learnerCount: 2, sessionCount: 1, markedSessions: 1,
      unmarkedSessions: 1, upcomingSessions: 1,
      presentMarks: 1, absentMarks: 1, unmarkedMarks: 2,
      upcomingMarks: 2, markedMarks: 2, averagePercent: 50,
    });
    expect(health.learners.find((row) => row.membershipId === "B")?.percentage).toBe(100);
  });

  it("does not claim attendance when no sessions have been marked", () => {
    expect(facultyAttendanceMonthSummary(["A"],
      [session("held", "2026-10-11T03:00:00Z", null)], [], NOW,
    )).toMatchObject({ averagePercent: null, markedMarks: 0, unmarkedMarks: 1 });
    expect(facultyAttendanceMonthSummary([], [], [], NOW)).toMatchObject({
      learnerCount: 0, sessionCount: 0, averagePercent: null,
    });
  });
});


describe("Faculty attendance guidance threshold, not a debarment", () => {
  it("uses exact ratios and keeps unmarked learners out of at-risk counts", () => {
    const data = facultyAttendanceThresholdBreakdown([
      { membershipId: "below", present: 121, absent: 41 }, // 74.69%, rounded display would show 75
      { membershipId: "at", present: 3, absent: 1 },
      { membershipId: "unknown", present: 0, absent: 0 },
      { membershipId: "clear", present: 9, absent: 1 },
    ], 75);
    expect(data).toEqual({
      threshold: 75, below: ["below"], unknown: ["unknown"], meets: 2,
    });
  });
  it("uses college policy thresholds and rejects invalid input without hiding unknowns", () => {
    expect(facultyAttendanceThresholdBreakdown([
      { membershipId: "low", present: 4, absent: 1 },
      { membershipId: "unknown", present: 0, absent: 0 },
    ], 85)).toEqual({
      threshold: 85, below: ["low"], unknown: ["unknown"], meets: 0,
    });
    expect(facultyAttendanceThresholdBreakdown([], Number.NaN).threshold).toBe(75);
  });
});
