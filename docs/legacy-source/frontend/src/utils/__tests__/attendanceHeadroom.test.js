import { attendanceHeadroom } from "@/utils/attendanceConstants";

describe("attendanceHeadroom", () => {
  test("can miss counts future classes in the total (10/10 at 75% -> 3, not 2)", () => {
    expect(attendanceHeadroom(10, 10, 75).canMiss).toBe(3);
    expect(attendanceHeadroom(4, 4, 75).canMiss).toBe(1);
    expect(attendanceHeadroom(3, 4, 75).canMiss).toBe(0);
  });

  test("must attend enough consecutive classes to reach the threshold", () => {
    // 5/10 at 75%: (5+n)/(10+n) >= .75 -> n >= 10
    expect(attendanceHeadroom(5, 10, 75)).toEqual({ canMiss: 0, mustAttend: 10, recoverable: true });
    expect(attendanceHeadroom(2, 3, 75).mustAttend).toBe(1);
  });

  test("a 100% requirement is not recoverable once a class is missed", () => {
    expect(attendanceHeadroom(9, 10, 100)).toEqual({ canMiss: 0, mustAttend: 0, recoverable: false });
  });

  test("no classes held yet is safe", () => {
    expect(attendanceHeadroom(0, 0, 75).mustAttend).toBe(0);
  });
});
