import { describe, expect, it } from "vitest";
import {
  countVerifiedExternalPlacements,
  externalOfferAnnualCtcInr,
  isVerifiedExternalPlacement,
  type ExternalOfferReview,
} from "@/modules/placements/external-offer-policy";

const verified: ExternalOfferReview = {
  status: "VERIFIED", reviewedByUserId: "tpo-admin",
  reviewedAt: new Date("2026-10-10T00:00:00Z"),
  revokedAt: null, ctcLpa: "10.25",
};

describe("DB08-C independent verified off-campus placement", () => {
  it("counts verified offers without manufacturing a job/application/offer chain", () => {
    expect(isVerifiedExternalPlacement(verified)).toBe(true);
    expect(countVerifiedExternalPlacements([verified])).toBe(1);
  });

  it("never counts submitted, rejected, revoked or incompletely verified records", () => {
    const excluded: ExternalOfferReview[] = [
      { ...verified, status: "SUBMITTED", reviewedAt: null, reviewedByUserId: null },
      { ...verified, status: "REJECTED" },
      { ...verified, status: "REVOKED", revokedAt: new Date("2026-10-11") },
      { ...verified, reviewedByUserId: null },
      { ...verified, reviewedAt: null },
    ];
    expect(excluded.every(x => !isVerifiedExternalPlacement(x))).toBe(true);
    expect(countVerifiedExternalPlacements([...excluded, verified])).toBe(1);
    expect(excluded.map(externalOfferAnnualCtcInr)).toEqual(
      [null, null, null, null, null],
    );
  });

  it("converts LPA decimal amounts exactly to INR without binary float rounding", () => {
    expect(externalOfferAnnualCtcInr(verified)).toBe(1_025_000n);
    expect(externalOfferAnnualCtcInr({ ...verified, ctcLpa: "0.01" })).toBe(1000n);
    expect(externalOfferAnnualCtcInr({ ...verified, ctcLpa: "8.3" })).toBe(830_000n);
    expect(externalOfferAnnualCtcInr({ ...verified, ctcLpa: "12.00" })).toBe(1_200_000n);
  });

  it("does not fabricate compensation when absent or invalid", () => {
    expect(externalOfferAnnualCtcInr({ ...verified, ctcLpa: null })).toBeNull();
    for (const malformed of ["NaN", "-1", "1.234", "1e6", "Infinity", " 1.00", "abc"]) {
      expect(externalOfferAnnualCtcInr({ ...verified, ctcLpa: malformed })).toBeNull();
    }
  });
});
