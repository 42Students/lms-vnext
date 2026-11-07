import { describe, expect, it } from "vitest";
import { timedDebarDraftError, todayInIndia, type DebarDuration } from "@/modules/placements/tpo-timed-debar-view-model";

const draft = (duration: DebarDuration, overrides: Partial<Parameters<typeof timedDebarDraftError>[0]> = {}) => ({
  reason: "Repeated placement policy violation", duration,
  untilDate: "2026-11-07", untilDrives: "3", today: "2026-11-07", ...overrides,
});

describe("UX-G160 TPO timed restrictions — pre-submit feedback", () => {
  it("uses the actual IST day around midnight, irrespective of executing timezone", () => {
    expect(todayInIndia(new Date("2026-11-07T18:29:00Z"))).toBe("2026-11-07");
    expect(todayInIndia(new Date("2026-11-07T18:31:00Z"))).toBe("2026-11-08");
  });
  it("permits the inclusive current/future calendar day and rejects invalid or expired dates", () => {
    for (const date of ["2026-11-07", "2026-11-08", "2028-02-29"])
      expect(timedDebarDraftError(draft("DATE", { untilDate: date }))).toBeNull();
    for (const date of ["", "2026-11-06", "2026-02-30", "2026-13-10", "2026-11-07Z"])
      expect(timedDebarDraftError(draft("DATE", { untilDate: date }))).not.toBeNull();
    expect(timedDebarDraftError(draft("DATE", { today: "2026-11-08" }))).not.toBeNull();
  });
  it("accepts only a bounded integer number of published drives", () => {
    for (const count of ["1", "3", "10000"])
      expect(timedDebarDraftError(draft("DRIVES", { untilDrives: count }))).toBeNull();
    for (const count of ["", "0", "-1", "10001", "1.5", "1e3", "Infinity", "NaN"])
      expect(timedDebarDraftError(draft("DRIVES", { untilDrives: count }))).not.toBeNull();
  });
  it("validates the required reason without making manual-only debarments depend on hidden fields", () => {
    expect(timedDebarDraftError(draft("MANUAL", { untilDate: "", untilDrives: "" }))).toBeNull();
    for (const reason of ["", "   ", "X".repeat(501)])
      expect(timedDebarDraftError(draft("MANUAL", { reason }))).not.toBeNull();
    expect(timedDebarDraftError(draft("MANUAL", { reason: " X " }))).toBeNull();
  });
});
