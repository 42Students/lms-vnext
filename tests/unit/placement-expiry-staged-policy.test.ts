import { describe, expect, it } from "vitest";
import { isPlacementOfferExpiredAt } from "@/modules/placements/placement-expiry-staged-policy";
describe("P-S2-07 expired offer action boundary", () => {
  const expiry = new Date("2026-10-16T07:00:00.000Z");
  it("rejects acceptance and decline at the precise expiry instant", () => {
    expect(isPlacementOfferExpiredAt(expiry, new Date(expiry.getTime() - 1))).toBe(false);
    expect(isPlacementOfferExpiredAt(expiry, expiry)).toBe(true);
    expect(isPlacementOfferExpiredAt(expiry, new Date(expiry.getTime() + 1))).toBe(true);
  });
  it("keeps valid undated offers actionable", () => {
    expect(isPlacementOfferExpiredAt(null, expiry)).toBe(false);
  });
});
