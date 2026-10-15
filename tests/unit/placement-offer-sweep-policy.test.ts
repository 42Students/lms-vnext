import { describe, expect, it } from "vitest";
import { isIssuedPlacementOfferDue, selectDuePlacementOfferIds } from "@/modules/placements/placement-offer-sweep-policy";

describe("P-S1-07 placement offer sweep selection", () => {
  const now = new Date("2026-10-16T12:00:00Z");
  it("expires at the exact instant and skips undated or future offers", () => {
    expect(isIssuedPlacementOfferDue({status:"ISSUED",expiresAt:now},now)).toBe(true);
    expect(isIssuedPlacementOfferDue({status:"ISSUED",expiresAt:new Date(now.getTime()+1)},now)).toBe(false);
    expect(isIssuedPlacementOfferDue({status:"ISSUED",expiresAt:null},now)).toBe(false);
  });
  it("never expires responded offers", () => {
    for (const status of ["ACCEPTED","DECLINED","WITHDRAWN","EXPIRED"]) {
      expect(isIssuedPlacementOfferDue({status,expiresAt:now},now)).toBe(false);
    }
  });
  it("returns only expirable IDs", () => {
    expect(selectDuePlacementOfferIds([
      {id:"a",status:"ISSUED",expiresAt:now},
      {id:"b",status:"ACCEPTED",expiresAt:now},
      {id:"c",status:"ISSUED",expiresAt:null},
    ],now)).toEqual(["a"]);
  });
});
