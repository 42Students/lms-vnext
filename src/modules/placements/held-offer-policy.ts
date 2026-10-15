import { canReleaseAnotherHeldOffer } from "./offer-college-rules-policy";

/**
 * P-S1-05: Legacy college held-offer cap with the higher-CTC uplift exception.
 *
 * Only official OFFER records that are ISSUED or ACCEPTED count as held.
 * LOIs, declined and withdrawn offers never count. A dream job bypasses the
 * cap, but the persisted isDream job classification needs the staged column.
 * Unknown CTC fails closed once the ordinary held-offer cap is reached.
 */
export type HeldPlacementOffer = {
  kind: string;
  status: string;
  annualCtcInr: number | null;
};

export function canAddPlacementHeldOffer(input: {
  maxHeldOffers: number;
  upliftPct: number;
  nextAnnualCtcInr: number | null;
  isDream: boolean;
  heldOffers: readonly HeldPlacementOffer[];
}): boolean {
  const activeOffers = input.heldOffers.filter(
    (offer) => offer.kind === "OFFER" &&
      (offer.status === "ISSUED" || offer.status === "ACCEPTED"),
  );
  return canReleaseAnotherHeldOffer({
    maxHeldOffers: input.maxHeldOffers,
    upliftPct: input.upliftPct,
    annualCtcInr: input.nextAnnualCtcInr,
    isDreamDrive: input.isDream,
    heldOffers: activeOffers,
  });
}

/** P-S1-04: same list affordance predicates as the self-apply write gate. */
export function canShowLearnerSelfApply(input: {
  registrationState: "CAN_APPLY" | "REGISTER_FIRST" | "CHOSE_OTHER";
  debarred: boolean;
  canSelfApply: boolean;
  hasApplication: boolean;
  deadlinePassed: boolean;
  eligibilityStatus: string;
  heldOfferEligible: boolean;
}): boolean {
  return input.registrationState === "CAN_APPLY" &&
    !input.debarred && input.canSelfApply && !input.hasApplication &&
    !input.deadlinePassed && input.heldOfferEligible &&
    (input.eligibilityStatus === "ELIGIBLE" ||
     input.eligibilityStatus === "ELIGIBLE_WITH_MISSING_EVIDENCE");
}
