import { learnerOfferExpiry } from "./learner-offer-expiry-model";
export type OfferExpiryRow = { status: string; expiresAt: string | null };
/** Urgent is a persisted, still-issued offer expiring in the next 24 hours. */
export function learnerOffersExpiringSoon(rows: readonly OfferExpiryRow[], nowMs: number) {
  return rows.filter(row => row.status === "ISSUED" && row.expiresAt !== null &&
    learnerOfferExpiry(Date.parse(row.expiresAt), nowMs).kind === "DUE_SOON").length;
}
