import { getAttendanceDay, isSessionAbsent, sessionIdOf } from "../adminAttendanceGrid";

describe("admin multi-session attendance", () => {
  test("identifies both response session ID conventions", () => {
    expect(sessionIdOf({ Id: 11 })).toBe(11);
    expect(sessionIdOf({ classScheduleId: 12 })).toBe(12);
    expect(sessionIdOf({ id: 13 })).toBe(13);
  });
  test("absence lookup accepts numeric and string IDs", () => {
    expect(isSessionAbsent(["12"], { classScheduleId: 12 })).toBe(true);
    expect(isSessionAbsent([3], { Id: 4 })).toBe(false);
  });
  test("a three-session day preserves per-session correction targets", () => {
    const sessions = [{ Id: 1 }, { classScheduleId: 2 }, { Id: 3 }];
    expect(getAttendanceDay(sessions, [2], () => true)).toMatchObject({
      count: 3, absentCount: 1, scheduled: true, allAbsent: false,
    });
  });
  test("future sessions do not appear as already held", () => {
    const sessions = [{ Id: 1, held: true }, { Id: 2, held: false }];
    expect(getAttendanceDay(sessions, [], (session) => session.held).count).toBe(1);
  });
  test("an unscheduled day is never marked absent", () => {
    expect(getAttendanceDay([], [], () => true)).toMatchObject({ scheduled: false, allAbsent: false });
  });
});
