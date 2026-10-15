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
