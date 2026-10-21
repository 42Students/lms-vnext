import { findByRoll, nextInQueue, roomSummary } from "../ui/driveDayRules";

const students = [
  { applicationId: 1, rollNumber: "21CS001", attendance: "WAITING" },
  { applicationId: 2, rollNumber: "21CS002", attendance: "PRESENT", assignedRoom: "Panel A", startsAt: "2026-10-12T09:20:00" },
  { applicationId: 3, rollNumber: "21EC007", attendance: "PRESENT", assignedRoom: "Panel A", startsAt: "2026-10-12T09:00:00" },
  { applicationId: 4, rollNumber: "21ME010", attendance: "PRESENT" },
  { applicationId: 5, rollNumber: "21EC011", attendance: "PRESENT", assignedRoom: "Panel B", startsAt: "2026-10-12T08:00:00" },
  { applicationId: 6, rollNumber: "21CS099", attendance: "IN_INTERVIEW", room: "Panel A" },
];

describe("findByRoll", () => {
  it("exact roll number, any case", () => expect(findByRoll(students, "21cs001").student.applicationId).toBe(1));
  it("a short suffix or prefix that matches one student is accepted", () => {
    expect(findByRoll(students, "007").student.applicationId).toBe(3);
    expect(findByRoll(students, "21ME").student.applicationId).toBe(4);
  });
  it("ambiguous input is returned, never guessed", () => {
    const r = findByRoll(students, "21CS");
    expect(r.student).toBeNull();
    expect(r.ambiguous.map((s) => s.applicationId)).toEqual([1, 2, 6]);
  });
  it("fewer than three characters never match by ending (a typo must not mark the wrong student)", () => {
    expect(findByRoll(students, "7")).toEqual({ student: null });
    expect(findByRoll(students, "07")).toEqual({ student: null });
  });
  it("nothing found, empty input", () => {
    expect(findByRoll(students, "99ZZ999")).toEqual({ student: null });
    expect(findByRoll(students, "  ")).toEqual({ student: null });
  });
});

describe("nextInQueue", () => {
  it("calls the earliest checked-in student assigned to the room", () => expect(nextInQueue(students, "Panel A").applicationId).toBe(3));
  it("never calls a student assigned to a different room, and skips those not checked in or already inside", () => {
    expect(nextInQueue(students, "Panel B").applicationId).toBe(5);
    expect([1, 6]).not.toContain(nextInQueue(students, "Panel A").applicationId);
  });
  it("a student with no room can be called to any room, after those assigned to it", () => {
    const only = [students[3]];
    expect(nextInQueue(only, "Panel C").applicationId).toBe(4);
    expect(nextInQueue(students.filter((s) => s.applicationId !== 3 && s.applicationId !== 2), "Panel A").applicationId).toBe(4);
  });
  it("nobody waiting means null", () => expect(nextInQueue([students[0], students[5]], "Panel A")).toBeNull());
});

describe("roomSummary", () => {
  it("counts who is waiting, inside and done per room", () => {
    expect(roomSummary(students)).toEqual([
      { name: "Panel A", waiting: 2, inside: 1, done: 0 },
      { name: "Panel B", waiting: 1, inside: 0, done: 0 },
    ]);
  });
});
