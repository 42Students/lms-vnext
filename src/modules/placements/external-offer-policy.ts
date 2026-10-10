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

/**
 * Off-campus offers require explicit placement-cell verification. Neither a
 * pending submission nor a rejected/revoked offer contributes to placements.
 * The caller keeps this decision and immutable audit event in one transaction.
 */
export type ExternalOfferDecision = "VERIFY" | "REJECT" | "REVOKE";
export type ExternalOfferStatus = ExternalOfferReview["status"];

export function nextExternalOfferStatus(
  before: ExternalOfferStatus,
  action: ExternalOfferDecision,
): ExternalOfferStatus {
  if (before === "SUBMITTED" && action === "VERIFY") return "VERIFIED";
  if (before === "SUBMITTED" && action === "REJECT") return "REJECTED";
  if (before === "VERIFIED" && action === "REVOKE") return "REVOKED";
  throw new Error("DB08_EXTERNAL_OFFER_INVALID_TRANSITION");
}
