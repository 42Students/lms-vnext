import { describe, expect, it } from "vitest";
import { learnerOfferAcceptancePreview } from "@/modules/placements/learner-offer-acceptance-preview";

const terms = {
  offerId: "11111111-1111-4111-8111-111111111111",
  companyName: "Example Ltd",
  roleTitle: "Engineer",
  jobTitle: "Graduate recruitment",
  annualCtcInr: 600000,
  joiningDate: null,
  expiresAt: "2026-10-14T18:30:00.000Z",
  status: "ISSUED" as const,
};

describe("Learner offer acceptance preview", () => {
  it("shows persisted terms, and only permits confirmation through an issued unexpired offer", () => {
    const result = learnerOfferAcceptancePreview(terms, new Date("2026-10-14T18:29:59Z"));
    expect(result.canConfirm).toBe(true);
    expect(result).toMatchObject({ companyName: "Example Ltd", annualCtcInr: 600000, joiningDate: null });
  });

  it("checks UTC expiry instants rather than treating an IST date as a UTC date", () => {
    // 18:30 UTC is 00:00 IST the next day.
    expect(learnerOfferAcceptancePreview(terms, new Date("2026-10-14T18:30:00Z")).canConfirm).toBe(true);
    const expired = learnerOfferAcceptancePreview(terms, new Date("2026-10-14T18:30:00.001Z"));
    expect(expired).toMatchObject({ expired: true, canConfirm: false });
  });

  it("rejects confirmation of non-issued status and malformed untrusted terms", () => {
    expect(learnerOfferAcceptancePreview({ ...terms, status: "ACCEPTED" }).canConfirm).toBe(false);
    expect(() => learnerOfferAcceptancePreview({ ...terms, offerId: "../x" })).toThrow();
    expect(() => learnerOfferAcceptancePreview({ ...terms, annualCtcInr: -1 })).toThrow();
    expect(() => learnerOfferAcceptancePreview({ ...terms, expiresAt: "tomorrow" })).toThrow();
  });

  it("does not invent an expiry when none was issued", () => {
    expect(learnerOfferAcceptancePreview({ ...terms, expiresAt: null }, new Date("2030-01-01T00:00:00Z")))
      .toMatchObject({ expired: false, canConfirm: true });
  });
});
