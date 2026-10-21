import { getAttendanceDay, isSessionCounted } from "@/utils/adminAttendanceGrid";

const held = () => true;

describe("admin attendance grid: unmarked sessions are not present", () => {
  test("a held session nobody marked does not count toward the student", () => {
    const day = getAttendanceDay([{ Id: 1, attendanceMarked: false }], [], held);
    expect(day.scheduled).toBe(true);
    expect(day.countedCount).toBe(0);
    expect(day.unmarkedCount).toBe(1);
  });

  test("a marked session with no absence counts as present", () => {
    const day = getAttendanceDay([{ Id: 1, attendanceMarked: true }], [], held);
    expect(day.countedCount).toBe(1);
    expect(day.absentCount).toBe(0);
  });

  test("an absence row counts even when the legacy marked flag is missing", () => {
    expect(isSessionCounted([7], { Id: 7 })).toBe(true);
    const day = getAttendanceDay([{ Id: 7 }, { Id: 8 }], [7], held);
    expect(day.countedCount).toBe(1);
    expect(day.absentCount).toBe(1);
    expect(day.unmarkedCount).toBe(1);
  });
});
