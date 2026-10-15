import { describe, expect, it } from "vitest";
import { canAddPlacementHeldOffer } from "@/modules/placements/held-offer-policy";

const offer = (annualCtcInr: number | null, status = "ISSUED", kind = "OFFER") =>
  ({ annualCtcInr, status, kind });

describe("P-S1-05 college held-offer uplift gate", () => {
  const defaults = {
    maxHeldOffers: 1,
    upliftPct: 40,
    nextAnnualCtcInr: 1_400_000,
    isDream: false,
    heldOffers: [offer(1_000_000)],
  };

  it("permits an ordinary first offer before the cap", () => {
    expect(canAddPlacementHeldOffer({ ...defaults, heldOffers: [] })).toBe(true);
  });

  it("counts accepted offers as held and enforces the uplift boundary inclusively", () => {
    expect(canAddPlacementHeldOffer({
      ...defaults,
      heldOffers: [offer(1_000_000, "ACCEPTED")],
    })).toBe(true);
    expect(canAddPlacementHeldOffer({
      ...defaults,
      heldOffers: [offer(1_000_000, "ACCEPTED")],
      nextAnnualCtcInr: 1_399_999,
    })).toBe(false);
  });

  it("uses the best held offer, not the first or average", () => {
    expect(canAddPlacementHeldOffer({
      ...defaults,
      maxHeldOffers: 2,
      heldOffers: [offer(1_000_000), offer(1_500_000)],
      nextAnnualCtcInr: 2_099_999,
    })).toBe(false);
    expect(canAddPlacementHeldOffer({
      ...defaults,
      maxHeldOffers: 2,
      heldOffers: [offer(1_000_000), offer(1_500_000)],
      nextAnnualCtcInr: 2_100_000,
    })).toBe(true);
  });

  it("excludes letters of intent and non-active offers", () => {
    expect(canAddPlacementHeldOffer({
      ...defaults,
      heldOffers: [
        offer(3_000_000, "ISSUED", "LOI"),
        offer(3_000_000, "DECLINED"),
        offer(2_000_000, "WITHDRAWN"),
      ],
      nextAnnualCtcInr: 100_000,
    })).toBe(true);
  });

  it("uses the dream exemption but rejects unknown CTC at capacity", () => {
    expect(canAddPlacementHeldOffer({
      ...defaults,
      isDream: true,
      nextAnnualCtcInr: null,
    })).toBe(true);
    expect(canAddPlacementHeldOffer({
      ...defaults,
      nextAnnualCtcInr: null,
    })).toBe(false);
    expect(canAddPlacementHeldOffer({
      ...defaults,
      heldOffers: [offer(null)],
    })).toBe(false);
  });
});
