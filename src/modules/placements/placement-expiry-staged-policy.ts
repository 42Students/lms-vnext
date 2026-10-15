/**
 * P-S2-07: exact expiry instant is non-actionable. EXPIRED persistence
 * requires the separately staged status constraints to be registered first.
 */
export function isPlacementOfferExpiredAt(
  expiresAt: Date | null, now: Date,
): boolean {
  return expiresAt !== null && now.getTime() >= expiresAt.getTime();
}
