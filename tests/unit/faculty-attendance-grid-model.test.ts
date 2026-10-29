import { describe, expect, it } from "vitest";
import {
  facultyAttendanceDayCell,
  groupFacultyAttendanceSessionsByIndiaDay,
  indiaAttendanceDayKey,
  indiaAttendanceMonthKey,
  shiftIndiaAttendanceMonth,
} from "@/modules/attendance/faculty-grid-model";

const now = new Date("2026-10-10T12:00:00.000Z");

describe("W02 Faculty attendance daily aggregation", () => {
  it("uses India-local month around UTC midnight and shifts across year boundaries", () => {
    expect(indiaAttendanceMonthKey("2026-09-30T18:00:00Z")).toBe("2026-09");
    expect(indiaAttendanceMonthKey("2026-09-30T19:00:00Z")).toBe("2026-10");
    expect(shiftIndiaAttendanceMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftIndiaAttendanceMonth("2027-01", -1)).toBe("2026-12");
    expect(shiftIndiaAttendanceMonth("", 1)).toBe("");
  });

  it("uses India-local day boundaries instead of UTC date boundaries", () => {
    expect(indiaAttendanceDayKey("2026-10-09T20:00:00.000Z"))
      .toBe("2026-10-10");
    const grouped = groupFacultyAttendanceSessionsByIndiaDay([
      { id: "a", startsAt: "2026-10-09T20:00:00.000Z", attendanceStatus: "MARKED" },
      { id: "b", startsAt: "2026-10-10T05:00:00.000Z", attendanceStatus: "MARKED" },
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.sessions.map((row) => row.id)).toEqual(["a", "b"]);
  });

  it("distinguishes present, absent and not-marked single sessions", () => {
    const present = [{ id: "p", startsAt: "2026-10-05T04:00:00.000Z", attendanceStatus: "MARKED" }];
    const absent = [{ id: "a", startsAt: "2026-10-06T04:00:00.000Z", attendanceStatus: "MARKED" }];
    const unmarked = [{ id: "n", startsAt: "2026-10-07T04:00:00.000Z", attendanceStatus: "UNMARKED" }];
    expect(facultyAttendanceDayCell(present, new Map(), now))
      .toMatchObject({ code: "P", label: "Present" });
    expect(facultyAttendanceDayCell(absent, new Map([
      ["a", { scheduleEventId: "a", membershipId: "m", status: "ABSENT" }],
    ]), now)).toMatchObject({ code: "A", label: "Absent" });
    expect(facultyAttendanceDayCell(unmarked, new Map(), now))
      .toMatchObject({ code: "—", label: "Not marked yet" });
  });

  it("collapses a mixed two-session day to the legacy 1/2 ratio with accessible detail", () => {
    const sessions = [
      { id: "morning", startsAt: "2026-10-08T03:30:00.000Z", attendanceStatus: "MARKED" },
      { id: "afternoon", startsAt: "2026-10-08T08:30:00.000Z", attendanceStatus: "MARKED" },
    ];
    const cell = facultyAttendanceDayCell(sessions, new Map([
      ["afternoon", { scheduleEventId: "afternoon", membershipId: "m", status: "ABSENT" }],
    ]), now);
    expect(cell).toEqual({
      code: "MIXED",
      label: "1 present, 1 absent, 0 not marked of 2 held sessions",
      present: 1,
      absent: 1,
      notMarked: 0,
      scheduled: 0,
      sessionCount: 2,
      ratio: "1/2",
    });
  });

  it("never converts a held unmarked class or a future class into present", () => {
    expect(facultyAttendanceDayCell([
      { id: "held", startsAt: "2026-10-08T03:30:00.000Z", attendanceStatus: null },
    ], new Map(), now).code).toBe("—");
    expect(facultyAttendanceDayCell([
      { id: "future", startsAt: "2026-10-12T03:30:00.000Z", attendanceStatus: null },
    ], new Map(), now).code).toBe("S");
  });

  it("does not count an unmarked session from a retained explicit PRESENT record", () => {
    const sess={id:"reviewed",startsAt:"2026-10-08T03:30:00.000Z",attendanceStatus:null};
    const present={scheduleEventId:"reviewed",membershipId:"learner",status:"PRESENT"};
    expect(facultyAttendanceDayCell([sess],new Map([["reviewed",present]]),now))
      .toMatchObject({code:"—",present:0,absent:0,notMarked:1});
    expect(facultyAttendanceDayCell([{...sess,attendanceStatus:"MARKED"}],
      new Map([["reviewed",present]]),now))
      .toMatchObject({code:"P",present:1,notMarked:0});
  });

  it("keeps imported medical/excused evidence marked without inventing an absence", () => {
    const cell = facultyAttendanceDayCell([
      { id: "legacy", startsAt: "2026-10-08T03:30:00.000Z", attendanceStatus: null },
    ], new Map([
      ["legacy", { scheduleEventId: "legacy", membershipId: "m", status: "MEDICAL" }],
    ]), now);
    expect(cell).toMatchObject({ code: "P", present: 1, absent: 0, notMarked: 0 });
  });
});
