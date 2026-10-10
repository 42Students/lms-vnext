import { describe, expect, it } from "vitest";
import { indiaAttendanceMonthWindow } from "@/modules/attendance/month-window";

describe("W02 attendance India month window", () => {
  it("maps an India-local month to UTC without losing the first or last 5h30m", () => {
    const october =
      indiaAttendanceMonthWindow("2026-10");

    expect(
      october.start.toISOString(),
    ).toBe("2026-09-30T18:30:00.000Z");
    expect(
      october.end.toISOString(),
    ).toBe("2026-10-31T18:30:00.000Z");
  });

  it("rolls December into the next year and rejects malformed months", () => {
    const december =
      indiaAttendanceMonthWindow("2026-12");
    expect(
      december.start.toISOString(),
    ).toBe("2026-11-30T18:30:00.000Z");
    expect(
      december.end.toISOString(),
    ).toBe("2026-12-31T18:30:00.000Z");

    expect(() =>
      indiaAttendanceMonthWindow("2026-13"),
    ).toThrow("YYYY-MM");
    expect(() =>
      indiaAttendanceMonthWindow("2026-1"),
    ).toThrow("YYYY-MM");
  });
});
