export const PLACEMENT_OFFER_EXPIRY_SWEEP_INTERVAL_MINUTES = 15 as const;

/**
 * P-S1-07: an issued offer becomes due at the exact expiry instant.
 * Keep this pure predicate shared by the sweep and response guards.
 */
export function isIssuedPlacementOfferDue(input: {
  status: string;
  expiresAt: Date | null;
}, now: Date): boolean {
  const expires = input.expiresAt?.getTime();
  return input.status === "ISSUED" && expires !== undefined &&
    Number.isFinite(expires) && expires <= now.getTime();
}

export function selectDuePlacementOfferIds(
  rows: readonly { id: string; status: string; expiresAt: Date | null }[],
  now: Date,
): string[] {
  return rows.filter(row => isIssuedPlacementOfferDue(row, now)).map(row => row.id);
}
