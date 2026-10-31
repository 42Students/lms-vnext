import { describe, expect, it } from "vitest";
import {
  facultyAttendanceNextRosterMarkedAt,
} from "@/modules/attendance/faculty-correction-token-model";

describe("DB045 monotonic Faculty attendance record tokens", () => {
  const now = new Date("2026-10-31T06:00:00.000Z");

  it("uses current time when the roster has no persisted attendance", () => {
    const result = facultyAttendanceNextRosterMarkedAt(now, []);
    expect(result.toISOString()).toBe(now.toISOString());
    expect(result).not.toBe(now);
  });

  it("advances beyond an Admin correction in the same millisecond", () => {
    const result = facultyAttendanceNextRosterMarkedAt(now, [
      {markedAt: new Date(now)},
    ]);
    expect(result.toISOString()).toBe("2026-10-31T06:00:00.001Z");
  });

  it("uses the latest locked row even if input ordering is not chronological", () => {
    const latest = new Date("2026-10-31T06:00:00.050Z");
    const result = facultyAttendanceNextRosterMarkedAt(now, [
      {markedAt: latest},
      {markedAt: new Date("2026-10-31T05:59:59.999Z")},
      {markedAt: new Date(now)},
    ]);
    expect(result.getTime()).toBe(latest.getTime() + 1);
    expect(latest.toISOString()).toBe("2026-10-31T06:00:00.050Z");
  });

  it("keeps the normal wall clock when every old row is older", () => {
    expect(facultyAttendanceNextRosterMarkedAt(now, [
      {markedAt: new Date("2026-10-31T05:59:59.000Z")},
    ])).toEqual(now);
  });
});
