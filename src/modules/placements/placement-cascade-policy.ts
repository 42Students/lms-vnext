/**
 * P-S1-06: correlation token for one atomic acceptance cascade. The same id
 * appears in the accepted offer and all automatically changed siblings.
 */
export function parsePlacementCascadeId(reason: string | null | undefined): string | null {
  if (!reason) return null;
  const match = /(?:^|;\s*)cascade:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:$|;)/i.exec(reason);
  return match?.[1]?.toLowerCase() ?? null;
}

import { canReleaseAnotherHeldOffer } from "./offer-college-rules-policy";

/** LEARNER-placements-R03: retain the internship type classifier for other
 * domain rules. Cascade exemption uses the college's persisted per-drive policy,
 * including custom job types, rather than inferring it from employment type. */
export function isPlacementInternship(value: string | null | undefined): boolean {
  return value?.trim().toUpperCase() === "INTERNSHIP";
}

export function shouldKeepPlacementCascadeSibling(input: {
  acceptedCountsAsPlaced: boolean;
  siblingCountsAsPlaced: boolean | null;
  siblingIsDream: boolean;
  siblingAnnualCtcInr: number | null;
  acceptedAnnualCtcInr: number | null;
  maxHeldOffers: number;
  upliftPct: number;
}): boolean {
  // An unaudited NULL never waives held-offer restrictions.
  // Only an explicitly persisted FALSE preserves the sibling automatically.
  if (!input.acceptedCountsAsPlaced || input.siblingCountsAsPlaced === false) return true;
  return canReleaseAnotherHeldOffer({
    maxHeldOffers: input.maxHeldOffers,
    upliftPct: input.upliftPct,
    heldOffers: [{ annualCtcInr: input.acceptedAnnualCtcInr }],
    annualCtcInr: input.siblingAnnualCtcInr,
    isDreamDrive: input.siblingIsDream,
  });
}
