import { describe, expect, it } from "vitest";
import { canAddPlacementHeldOffer } from "@/modules/placements/held-offer-policy";
import { verifiedExternalCtcInr } from "@/modules/placements/held-offer-facts-service";

describe("P-S1-05 verified off-campus offers as held CTC", () => {
  it("converts exact two-decimal lakh amounts without floating point rounding", () => {
    expect(verifiedExternalCtcInr("12.50")).toBe(1_250_000);
    expect(verifiedExternalCtcInr("0.01")).toBe(1_000);
    expect(verifiedExternalCtcInr("5")).toBe(500_000);
    expect(verifiedExternalCtcInr(null)).toBeNull();
  });
  it("fails closed when the CTC is malformed or cannot fit safely", () => {
    for (const value of ["12.345", "-1", "oops", "999999999999999999.99"]) {
      expect(verifiedExternalCtcInr(value)).toBeNull();
    }
  });
  it("requires uplift over an external VERIFIED hold at capacity", () => {
    const heldOffers = [{
      kind: "OFFER", status: "ACCEPTED",
      annualCtcInr: verifiedExternalCtcInr("12.50"),
    }];
    expect(canAddPlacementHeldOffer({
      maxHeldOffers: 1, upliftPct: 40,
      nextAnnualCtcInr: 1_749_999, isDream: false, heldOffers,
    })).toBe(false);
    expect(canAddPlacementHeldOffer({
      maxHeldOffers: 1, upliftPct: 40,
      nextAnnualCtcInr: 1_750_000, isDream: false, heldOffers,
    })).toBe(true);
  });
});
