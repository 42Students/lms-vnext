import { describe, expect, it } from "vitest";
import { selectDuePlacementOfferIds } from "@/modules/placements/placement-offer-sweep-policy";

describe("P-S1-07 expiration batch safety", () => {
  const now = new Date("2026-10-16T12:00:00Z");
  it("does not consume accepted offers when the batch contains mixed status", () => {
    expect(selectDuePlacementOfferIds([
      {id:"first",status:"ISSUED",expiresAt:new Date(now.getTime()-1)},
      {id:"accepted",status:"ACCEPTED",expiresAt:now},
      {id:"second",status:"ISSUED",expiresAt:now},
    ],now)).toEqual(["first","second"]);
  });
  it("does not treat a corrupt timestamp as an eligible persisted expiry", () => {
    expect(selectDuePlacementOfferIds([
      {id:"invalid",status:"ISSUED",expiresAt:new Date("invalid")},
    ],now)).toEqual([]);
  });
});
