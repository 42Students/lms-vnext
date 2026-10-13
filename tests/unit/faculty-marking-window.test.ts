import { describe, expect, it } from "vitest";
import { facultyAttendanceMarkingWindow } from "@/modules/attendance/faculty-marking-window";

const at = (hour: number) => new Date(Date.UTC(2026, 9, 13, hour));

describe("Faculty attendance marking window", () => {
  it("rejects before session begins and permits marking at the exact start", () => {
    const schedule = { startsAt: at(8), endsAt: at(9), correctionWindowHours: 24 };
    expect(facultyAttendanceMarkingWindow({ ...schedule, now: at(7) })).toBe("NOT_STARTED");
    expect(facultyAttendanceMarkingWindow({ ...schedule, now: at(8) })).toBe("OPEN");
  });

  it("permits corrections until the configured hours after class end, then expires", () => {
    const schedule = { startsAt: at(8), endsAt: at(9), correctionWindowHours: 2 };
    expect(facultyAttendanceMarkingWindow({ ...schedule, now: at(11) })).toBe("OPEN");
    expect(facultyAttendanceMarkingWindow({ ...schedule, now: new Date(at(11).getTime() + 1) }))
      .toBe("WINDOW_EXPIRED");
  });

  it("uses an immediate cutoff when college policy is zero hours", () => {
    const schedule = { startsAt: at(8), endsAt: at(9), correctionWindowHours: 0 };
    expect(facultyAttendanceMarkingWindow({ ...schedule, now: at(9) })).toBe("OPEN");
    expect(facultyAttendanceMarkingWindow({ ...schedule, now: at(10) })).toBe("WINDOW_EXPIRED");
  });

  it("fails closed for missing/invalid policy and malformed session boundaries", () => {
    expect(facultyAttendanceMarkingWindow({
      startsAt: at(10), endsAt: at(9), now: at(10), correctionWindowHours: 24,
    })).toBe("WINDOW_EXPIRED");
    expect(facultyAttendanceMarkingWindow({
      startsAt: at(8), endsAt: at(9), now: at(8), correctionWindowHours: Number.NaN,
    })).toBe("WINDOW_EXPIRED");
  });
});
