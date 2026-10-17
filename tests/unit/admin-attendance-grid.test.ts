import { describe, expect, it } from "vitest";
import {
  adminAttendanceCellState,
  adminAttendancePercent,
  attendanceCsvCell,
  attendanceIndiaDay,
  groupAttendanceDays,
  shiftAttendanceMonth,
} from "@/modules/attendance/admin-grid-model";
import { facultyAttendanceMarkingWindow } from "@/modules/attendance/faculty-marking-window";

const NOW = new Date("2026-10-14T08:00:00Z");
const session = (id: string, startsAt: string, attendanceStatus: string | null = "MARKED") =>
  ({ id, startsAt, attendanceStatus });

describe("College Admin attendance center", () => {
  it("uses Asia/Kolkata day boundaries and groups multiple sessions", () => {
    expect(attendanceIndiaDay("2026-09-30T19:00:00Z")).toBe("2026-10-01");
    const days = groupAttendanceDays([
      session("two", "2026-10-13T06:00:00Z"),
      session("one", "2026-10-13T03:00:00Z"),
      session("old", "2026-10-12T18:15:00Z"),
    ]);
    expect(days.map((day) => day.day)).toEqual(["2026-10-12", "2026-10-13"]);
    expect(days[1]?.sessions.map((item) => item.id)).toEqual(["one", "two"]);
  });

  it("navigates across months and years", () => {
    expect(shiftAttendanceMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftAttendanceMonth("2026-12", 1)).toBe("2027-01");
    expect(() => shiftAttendanceMonth("2026-13", 1)).toThrow();
  });

  it("does not count future or unmarked sessions", () => {
    const sessions = [
      session("present", "2026-10-13T06:00:00Z"),
      session("absent", "2026-10-13T07:00:00Z"),
      session("unmarked", "2026-10-13T08:00:00Z", "UNMARKED"),
      session("future", "2026-10-15T06:00:00Z"),
    ];
    const records = [{ scheduleEventId: "absent", membershipId: "learner", status: "ABSENT" }];
    expect(adminAttendancePercent("learner", sessions, records, NOW)).toBe(50);
    expect(adminAttendanceCellState(sessions[2]!, undefined, NOW).label).toBe("Not marked");
    expect(adminAttendanceCellState(sessions[3]!, undefined, NOW).counted).toBe(false);
    expect(adminAttendancePercent("learner", [sessions[2]!], [], NOW)).toBeNull();
    expect(adminAttendanceCellState(sessions[0]!, undefined, NOW).label).toBe("Present");
  });

  it("COL-attendance-R01 keeps unmarked classmates uncounted after one admin correction", () => {
    const notMarked = session("class-1", "2026-10-13T06:00:00Z", null);
    const absent = {scheduleEventId:notMarked.id,membershipId:"learner-a",status:"ABSENT"};
    const learnerA = adminAttendanceCellState(notMarked,absent,NOW);
    const learnerB = adminAttendanceCellState(notMarked,undefined,NOW);
    expect(learnerA).toMatchObject({code:"A",label:"Absent",counted:false,present:false});
    expect(learnerB).toMatchObject({code:"—",label:"Not marked",counted:false,present:false});
    expect(adminAttendancePercent("learner-a",[notMarked],[absent],NOW)).toBeNull();
    expect(adminAttendancePercent("learner-b",[notMarked],[absent],NOW)).toBeNull();
  });

  it("honors exact correction-window start and end boundaries", () => {
    const base = {
      startsAt: new Date("2026-10-14T07:00:00Z"),
      endsAt: new Date("2026-10-14T08:00:00Z"),
      correctionWindowHours: 24,
    };
    expect(facultyAttendanceMarkingWindow({
      ...base, now: new Date("2026-10-14T06:59:00Z"),
    })).toBe("NOT_STARTED");
    expect(facultyAttendanceMarkingWindow({
      ...base, now: new Date("2026-10-15T08:00:00Z"),
    })).toBe("OPEN");
    expect(facultyAttendanceMarkingWindow({
      ...base, now: new Date("2026-10-15T08:00:01Z"),
    })).toBe("WINDOW_EXPIRED");
  });

  it("quotes CSV cells and stops formula injection", () => {
    expect(attendanceCsvCell('Example "Learner"')).toBe('"Example ""Learner"""');
    expect(attendanceCsvCell("=SUM(A1:A5)")).toBe("\"'=SUM(A1:A5)\"");
    expect(attendanceCsvCell("  @formula")).toBe("\"'  @formula\"");
    expect(attendanceCsvCell(null)).toBe('""');
  });
});
