import { describe, expect, it } from "vitest";
import { initialAbsencesForSession, resolveFacultyAttendanceSession, resolveFacultyAttendanceDeepLink } from "@/modules/attendance/faculty-attendance-edit-state";

const roster = [
  { membershipId: "a" }, { membershipId: "b" }, { membershipId: "c" },
];
const records = [
  { scheduleEventId: "session-1", membershipId: "b", status: "ABSENT" },
  { scheduleEventId: "session-2", membershipId: "c", status: "ABSENT" },
  { scheduleEventId: "session-1", membershipId: "outsider", status: "ABSENT" },
];

describe("Faculty attendance editor current absence state", () => {
  it("restores only recorded absences in the current session's roster", () => {
    expect([...initialAbsencesForSession(roster, records, "session-1")]).toEqual(["b"]);
  });
  it("recomputes after changing sessions without carrying absence selections", () => {
    expect([...initialAbsencesForSession(roster, records, "session-2")]).toEqual(["c"]);
  });
  it("does not turn admin-coded PRESENT, LATE, EXCUSED or MEDICAL into faculty absences", () => {
    const adminRecords = ["PRESENT", "LATE", "EXCUSED", "MEDICAL"].map((status) => ({
      scheduleEventId: "session-1", membershipId: "a", status,
    }));
    expect([...initialAbsencesForSession(roster, adminRecords, "session-1")]).toEqual([]);
    expect([...initialAbsencesForSession(roster, [
      ...adminRecords,
      { scheduleEventId: "session-1", membershipId: "b", status: "ABSENT" },
      { scheduleEventId: "session-2", membershipId: "c", status: "ABSENT" },
    ], "session-1")]).toEqual(["b"]);
  });
  it("starts all learners present when a new session has no absence records", () => {
    expect(initialAbsencesForSession(roster, records, "new").size).toBe(0);
  });
});

describe("Faculty calendar-to-attendance selection", () => {
  const exact = [{ id: "session-1" }, { id: "session-2" }];
  it("keeps a requested session inside the authorized delivery", () => {
    expect(resolveFacultyAttendanceSession(exact, "session-2")).toBe("session-2");
    expect(resolveFacultyAttendanceSession(exact, "other-delivery-session")).toBe("session-1");
  });
  it("handles absent, arbitrary and empty session links without rendering a fake session", () => {
    expect(resolveFacultyAttendanceSession(exact, undefined)).toBe("session-1");
    expect(resolveFacultyAttendanceSession(exact, { id: "session-2" })).toBe("session-1");
    expect(resolveFacultyAttendanceSession([], "session-2")).toBe("");
  });
});

describe("Faculty Attendance URL mode selection", () => {
  const sessions = [{id:"one"},{id:"two"}];
  it("opens Report when there is no valid Calendar link", () => {
    expect(resolveFacultyAttendanceDeepLink(sessions, undefined)).toBeNull();
    expect(resolveFacultyAttendanceDeepLink(sessions, "other-delivery")).toBeNull();
    expect(resolveFacultyAttendanceDeepLink([], "one")).toBeNull();
  });
  it("opens Mark only for an exact authorized persisted session", () => {
    expect(resolveFacultyAttendanceDeepLink(sessions, "two")).toBe("two");
  });
});
