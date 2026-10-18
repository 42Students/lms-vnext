import { describe, expect, it } from "vitest";
import {
  facultyAttendanceMarkingWindow,
} from "@/modules/attendance/faculty-marking-window";
const start = new Date("2099-01-01T09:00:00.000Z");
const end = new Date("2099-01-01T10:00:00.000Z");
const check = (now: Date, correctionWindowHours = 2) =>
  facultyAttendanceMarkingWindow({ startsAt: start, endsAt: end, correctionWindowHours, now });
describe("FAC-ATTENDANCE-WINDOW-01 strict Faculty marking/correction cutoff", () => {
  it("refuses a mark before lecture start and accepts exactly at lecture start", () => {
    expect(check(new Date("2099-01-01T08:59:59.999Z"))).toBe("NOT_STARTED");
    expect(check(start)).toBe("OPEN");
  });

  it("holds exact correction expiry but refuses the next millisecond", () => {
    expect(check(new Date("2099-01-01T12:00:00.000Z"))).toBe("OPEN");
    expect(check(new Date("2099-01-01T12:00:00.001Z"))).toBe("WINDOW_EXPIRED");
    expect(check(end, 0)).toBe("OPEN");
    expect(check(new Date("2099-01-01T10:00:00.001Z"), 0)).toBe("WINDOW_EXPIRED");
  });

  it("fails closed on reversed/invalid sessions and invalid now values", () => {
    for (const windows of [
      { startsAt: new Date("invalid"), endsAt: end },
      { startsAt: start, endsAt: new Date("invalid") },
      { startsAt: end, endsAt: start },
      { startsAt: start, endsAt: start },
    ]) {
      expect(facultyAttendanceMarkingWindow({
        ...windows, correctionWindowHours: 2, now: start,
      })).toBe("WINDOW_EXPIRED");
    }
    expect(check(new Date("invalid"))).toBe("WINDOW_EXPIRED");
  });

  it("refuses negative/nonfinite and huge correction settings rather than creating infinite edit windows", () => {
    for (const hours of [-1, NaN, Infinity, -Infinity, Number.MAX_VALUE]) {
      expect(check(new Date("2100-01-01T00:00:00Z"), hours))
        .toBe("WINDOW_EXPIRED");
    }
  });
});
