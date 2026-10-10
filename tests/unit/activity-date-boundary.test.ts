import { describe, expect, it } from "vitest";
import { parseActivityDateBoundary } from "@/modules/activity/date-boundary";

describe("W06 Activity Log date boundaries", () => {
  it("maps an India-local date to the full UTC interval", () => {
    expect(parseActivityDateBoundary("2026-10-10", "from").toISOString())
      .toBe("2026-10-09T18:30:00.000Z");
    expect(parseActivityDateBoundary("2026-10-10", "to").toISOString())
      .toBe("2026-10-10T18:29:59.999Z");
  });

  it("preserves explicit-offset datetimes", () => {
    expect(parseActivityDateBoundary(
      "2026-10-10T23:59:59.000+05:30", "to",
    ).toISOString()).toBe("2026-10-10T18:29:59.000Z");
    expect(parseActivityDateBoundary(
      "2026-10-10T12:30:00.000Z", "from",
    ).toISOString()).toBe("2026-10-10T12:30:00.000Z");
  });

  it("rejects impossible and timezone-ambiguous values", () => {
    for (const value of [
      "2026-02-30",
      "2026-13-01",
      "2026-10-10T12:00:00",
      "10/10/2026",
      "",
      "garbage",
    ]) {
      expect(() => parseActivityDateBoundary(value, "from")).toThrow(
        "ACTIVITY_DATE_INVALID",
      );
    }
  });

  it("copies valid Date inputs and rejects invalid Date inputs", () => {
    const source = new Date("2026-10-10T00:00:00.000Z");
    const result = parseActivityDateBoundary(source, "from");
    expect(result.toISOString()).toBe(source.toISOString());
    expect(result).not.toBe(source);
    expect(() => parseActivityDateBoundary(new Date(NaN), "to")).toThrow();
  });
});
