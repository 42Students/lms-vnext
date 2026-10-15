import { describe, expect, it } from "vitest";
import { hasActivePlacementDebarment, placementCollegeDateInIndia } from "@/modules/placements/placement-debarment-gate";
describe("P-S1-02 application debarment", () => {
  const now = new Date("2026-10-16T19:30:00Z");
  const base = { liftedAt: null, untilDate: "2026-10-17", untilDrives: 1, drivesCounted: 99 };
  it("uses college-local IST date", () => expect(placementCollegeDateInIndia(now)).toBe("2026-10-17"));
  it("prioritizes the end date, and ignores lifted bans", () => {
    expect(hasActivePlacementDebarment([base], now)).toBe(true);
    expect(hasActivePlacementDebarment([{ ...base, untilDate: "2026-10-16" }], now)).toBe(false);
    expect(hasActivePlacementDebarment([{ ...base, liftedAt: now }], now)).toBe(false);
  });
  it("honours drive-count and indefinite exclusions", () => {
    expect(hasActivePlacementDebarment([{ ...base, untilDate: null, drivesCounted: 0 }], now)).toBe(true);
    expect(hasActivePlacementDebarment([{ ...base, untilDate: null, drivesCounted: 1 }], now)).toBe(false);
    expect(hasActivePlacementDebarment([{ ...base, untilDate: null, untilDrives: null }], now)).toBe(true);
    expect(hasActivePlacementDebarment([], now)).toBe(false);
  });
});

// All write paths consume the same date/count precedence; one mode must not
// re-interpret a lifted or exhausted ban as active for a different writer.
describe("P-S1-02 shared self-apply, bulk add and Drive Day policy", () => {
  const today = new Date("2026-10-16T10:00:00.000Z");
  it("rejects a mixed set while any unlifted ban remains", () => {
    const base = { liftedAt: null, untilDate: null, untilDrives: 3, drivesCounted: 2 };
    expect(hasActivePlacementDebarment([
      { ...base, liftedAt: new Date("2026-10-15T00:00:00Z") }, base,
    ], today)).toBe(true);
    expect(hasActivePlacementDebarment([
      { ...base, drivesCounted: 3 }, { ...base, liftedAt: today },
    ], today)).toBe(false);
  });
});
