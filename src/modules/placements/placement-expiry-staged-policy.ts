/**
 * P-S2-07: exact expiry instant is non-actionable. EXPIRED persistence
 * persists under the registered 0085 constraints; scheduler activation is separate.
 */
export function isPlacementOfferExpiredAt(
  expiresAt: Date | null, now: Date,
): boolean {
  return expiresAt !== null && (!Number.isFinite(expiresAt.getTime()) ||
    now.getTime() >= expiresAt.getTime());
}
