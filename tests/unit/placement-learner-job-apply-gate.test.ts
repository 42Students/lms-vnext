import { describe, expect, it } from "vitest";
import { canShowLearnerSelfApply, canAddPlacementHeldOffer } from "@/modules/placements/held-offer-policy";

const eligible = {
  registrationState: "CAN_APPLY" as const, debarred: false,
  canSelfApply: true, hasApplication: false, deadlinePassed: false,
  eligibilityStatus: "ELIGIBLE", heldOfferEligible: true,
};

describe("P-S1-04/P-S1-05 learner jobs affordance", () => {
  it("allows an eligible and registered learner only before the deadline", () => {
    expect(canShowLearnerSelfApply(eligible)).toBe(true);
    expect(canShowLearnerSelfApply({ ...eligible, deadlinePassed: true })).toBe(false);
  });
  it("blocks missing registration, opt-out, finished cohorts and held-offer cap", () => {
    expect(canShowLearnerSelfApply({ ...eligible, registrationState: "REGISTER_FIRST" })).toBe(false);
    expect(canShowLearnerSelfApply({ ...eligible, registrationState: "CHOSE_OTHER" })).toBe(false);
    expect(canShowLearnerSelfApply({ ...eligible, canSelfApply: false })).toBe(false);
    expect(canShowLearnerSelfApply({ ...eligible, heldOfferEligible: false })).toBe(false);
  });
  it("never treats a prior application or debarment as a fresh apply", () => {
    expect(canShowLearnerSelfApply({ ...eligible, hasApplication: true })).toBe(false);
    expect(canShowLearnerSelfApply({ ...eligible, debarred: true })).toBe(false);
  });
  it("gates CTC at the identical held-offer threshold", () => {
    const held = [{ kind: "OFFER", status: "ACCEPTED", annualCtcInr: 1_000_000 }];
    expect(canAddPlacementHeldOffer({ maxHeldOffers: 1, upliftPct: 40,
      nextAnnualCtcInr: 1_399_999, isDream: false, heldOffers: held })).toBe(false);
  });
});
