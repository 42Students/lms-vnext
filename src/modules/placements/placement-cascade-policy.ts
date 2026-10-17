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

/** LEARNER-placements-R03: a qualifying offer keeps Dream, uplift and
 * internship applications alive rather than ending every sibling journey. */
export function isPlacementInternship(value: string | null | undefined): boolean {
  return value?.trim().toUpperCase() === "INTERNSHIP";
}

export function shouldKeepPlacementCascadeSibling(input: {
  acceptedCountsAsPlaced: boolean;
  siblingIsInternship: boolean;
  siblingIsDream: boolean;
  siblingAnnualCtcInr: number | null;
  acceptedAnnualCtcInr: number | null;
  maxHeldOffers: number;
  upliftPct: number;
}): boolean {
  if (!input.acceptedCountsAsPlaced || input.siblingIsInternship) return true;
  return canReleaseAnotherHeldOffer({
    maxHeldOffers: input.maxHeldOffers,
    upliftPct: input.upliftPct,
    heldOffers: [{ annualCtcInr: input.acceptedAnnualCtcInr }],
    annualCtcInr: input.siblingAnnualCtcInr,
    isDreamDrive: input.siblingIsDream,
  });
}
