import { describe, expect, it } from "vitest";
import { projectOfferLetterEvidence } from "@/modules/placements/tpo-offer-letter-evidence-model";
describe("offer letter evidence boundaries", () => {
  it("never equates recorded offer response with letter acknowledgement", () => {
    const [row] = projectOfferLetterEvidence([{
      offerId: "offer-1", offerStatus: "ACCEPTED",
      issuedAt: new Date("2026-10-14T08:00:00Z"),
      respondedAt: new Date("2026-10-14T09:00:00Z"),
    }]);
    expect(row).toMatchObject({
      offerStatus: "ACCEPTED",
      letterIssuedStatus: "UNAVAILABLE",
      letterAcknowledgedStatus: "UNAVAILABLE",
    });
  });
  it("handles an empty persisted offers list honestly", () => {
    expect(projectOfferLetterEvidence([])).toEqual([]);
  });
});
