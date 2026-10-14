export type PersistedOfferLetterEvidence = {
  offerId: string;
  offerStatus: string;
  issuedAt: Date;
  respondedAt: Date | null;
};

/**
 * Registered offer issuance is not letter issuance. No signed document,
 * letter acknowledgement or delivery event exists in registered P8.
 */
export function projectOfferLetterEvidence(rows: readonly PersistedOfferLetterEvidence[]) {
  return rows.map((offer) => ({
    offerId: offer.offerId,
    offerStatus: offer.offerStatus,
    persistedOfferIssuedAt: offer.issuedAt.toISOString(),
    offerRespondedAt: offer.respondedAt?.toISOString() ?? null,
    letterIssuedStatus: "UNAVAILABLE" as const,
    letterAcknowledgedStatus: "UNAVAILABLE" as const,
  }));
}
