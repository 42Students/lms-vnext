import { formatTimestamp, parseServerTimestamp } from "@/components/admin/projects/adminProjectUtils";

describe("project event times are UTC", () => {
  test("a Jackson array is read as UTC, not local time", () => {
    const { date, dateOnly } = parseServerTimestamp([2026, 10, 3, 5, 59, 11]);
    expect(dateOnly).toBe(false);
    expect(date.toISOString()).toBe("2026-10-03T05:59:11.000Z");
  });

  test("an ISO string without a zone is UTC; one with a zone is kept", () => {
    expect(parseServerTimestamp("2026-10-03T14:11:23").date.toISOString()).toBe("2026-10-03T14:11:23.000Z");
    expect(parseServerTimestamp("2026-10-03T14:11:23+05:30").date.toISOString()).toBe("2026-10-03T08:41:23.000Z");
    expect(parseServerTimestamp("2026-10-03T14:11:23Z").date.toISOString()).toBe("2026-10-03T14:11:23.000Z");
  });

  test("plain dates stay calendar dates with no time", () => {
    expect(parseServerTimestamp("2026-10-03").dateOnly).toBe(true);
    expect(parseServerTimestamp([2026, 10, 3]).dateOnly).toBe(true);
    expect(formatTimestamp([2026, 10, 3])).not.toMatch(/AM|PM|:/);
  });

  test("garbage falls back to a dash", () => {
    expect(formatTimestamp(null)).toBe("—");
  });
});
