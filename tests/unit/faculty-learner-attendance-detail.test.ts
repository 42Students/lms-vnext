import { describe, expect, it } from "vitest";
import { facultyLearnerAttendanceDetail } from "@/modules/attendance/faculty-learner-attendance-detail";

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

  it("uses persisted absence evidence on historic sessions without a session marker", () => {
    const result = facultyLearnerAttendanceDetail("student",
      [session("historic", "2026-10-08T03:00:00Z", null)],
      [{ scheduleEventId: "historic", membershipId: "student", status: "MEDICAL", note: "medical", markedAt: "2026-10-08T05:00:00Z" }],
      NOW,
    );
    expect(result).toMatchObject({ absent: 1, marked: 1, attendedPercent: 0 });
    expect(result.rows[0]).toMatchObject({ code: "A", note: "medical" });
  });
});
