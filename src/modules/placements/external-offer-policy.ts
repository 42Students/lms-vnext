/**
 * DB08-C: external verification is distinct from job/application/offer chains.
 * Only a placement-cell VERIFIED and non-revoked external offer may count
 * toward held salary, placement counts, or future uplift decisions.
 *
 * String salary avoids JS float rounding of DECIMAL(10,2) lakh-per-annum.
 */
export type ExternalOfferReview = {
  status: "SUBMITTED" | "VERIFIED" | "REJECTED" | "REVOKED";
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  revokedAt: Date | null;
  ctcLpa: string | null;
};

export function isVerifiedExternalPlacement(offer: ExternalOfferReview): boolean {
  return offer.status === "VERIFIED" &&
    offer.reviewedAt !== null && offer.reviewedByUserId !== null &&
    offer.revokedAt === null;
}

/**
 * Convert x.xx LPA to annual whole INR exactly:
 * 1.00 LPA = 100,000 INR; the hundredths digit equals 1,000 INR.
 * A valid VERIFIED external offer may have unknown CTC; it still represents
 * a placement, but contributes no fabricated number to monetary sums.
 */
export function externalOfferAnnualCtcInr(
  offer: ExternalOfferReview,
): bigint | null {
  if (!isVerifiedExternalPlacement(offer) || offer.ctcLpa === null) return null;
  if (!/^(?:0|[1-9][0-9]{0,7})(?:\.[0-9]{1,2})?$/.test(offer.ctcLpa)) return null;
  const [whole, fractional = ""] = offer.ctcLpa.split(".");
  return (BigInt(whole) * 100n + BigInt(fractional.padEnd(2,"0"))) * 1000n;
}

export function countVerifiedExternalPlacements(
  offers: readonly ExternalOfferReview[],
): number {
  return offers.filter(isVerifiedExternalPlacement).length;
}
