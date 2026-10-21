import { wallClockToDayjs, formatWallClock } from "@/utils/dateUtils";

describe("author-typed times (deadlines) read as wall-clock", () => {
  test("Jackson array is not Invalid Date and keeps the typed time", () => {
    expect(formatWallClock([2026, 10, 4, 23, 59], "YYYY-MM-DD HH:mm")).toBe("2026-10-04 23:59");
  });
  test("zone-less string keeps the typed time", () => {
    expect(formatWallClock("2026-10-04T23:59:00", "YYYY-MM-DD HH:mm")).toBe("2026-10-04 23:59");
  });
  test("empty and garbage give the fallback", () => {
    expect(formatWallClock(null)).toBe("—");
    expect(formatWallClock("nope")).toBe("—");
    expect(wallClockToDayjs(undefined)).toBeNull();
  });
});
