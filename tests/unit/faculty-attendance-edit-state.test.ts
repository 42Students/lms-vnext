import { describe, expect, it } from "vitest";
import { initialAbsencesForSession } from "@/modules/attendance/faculty-attendance-edit-state";

const roster = [
  { membershipId: "a" }, { membershipId: "b" }, { membershipId: "c" },
];
const records = [
  { scheduleEventId: "session-1", membershipId: "b" },
  { scheduleEventId: "session-2", membershipId: "c" },
  { scheduleEventId: "session-1", membershipId: "outsider" },
];

describe("Faculty attendance editor current absence state", () => {
  it("restores only recorded absences in the current session's roster", () => {
    expect([...initialAbsencesForSession(roster, records, "session-1")]).toEqual(["b"]);
  });
  it("recomputes after changing sessions without carrying absence selections", () => {
    expect([...initialAbsencesForSession(roster, records, "session-2")]).toEqual(["c"]);
  });
  it("starts all learners present when a new session has no absence records", () => {
    expect(initialAbsencesForSession(roster, records, "new").size).toBe(0);
  });
});
