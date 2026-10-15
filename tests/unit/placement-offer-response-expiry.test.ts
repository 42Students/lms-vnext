import { describe, expect, it } from "vitest";
import { isPlacementOfferResponseExpired } from "@/modules/placements/offer-college-rules-policy";

describe("D5 offer response expiry is exclusive", () => {
  const deadline = new Date("2026-10-16T10:30:00.000Z");
  it("allows until immediately before the deadline and denies at equality", () => {
    expect(isPlacementOfferResponseExpired(deadline, new Date(deadline.getTime()-1))).toBe(false);
    expect(isPlacementOfferResponseExpired(deadline, deadline)).toBe(true);
    expect(isPlacementOfferResponseExpired(deadline, new Date(deadline.getTime()+1))).toBe(true);
  });
  it("keeps offers without deadlines actionable but treats corrupt dates as expired", () => {
    expect(isPlacementOfferResponseExpired(null, deadline)).toBe(false);
    expect(isPlacementOfferResponseExpired(new Date("invalid"), deadline)).toBe(true);
  });
});
