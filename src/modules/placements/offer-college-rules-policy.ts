/**
 * P-S1-01/P-S1-05/P-S2-06: legacy college offer limits and response window.
 * These are business rules, not UI labels. Callers supply persisted college
 * policy and the candidate's current, college-scoped held offers.
 */
export type HeldOfferFact = { annualCtcInr: number | null };

export function canReleaseAnotherHeldOffer(input: {
  maxHeldOffers: number;
  upliftPct: number;
  heldOffers: readonly HeldOfferFact[];
  annualCtcInr: number | null;
  isDreamDrive: boolean;
}): boolean {
  if (input.isDreamDrive) return true;
  if (input.heldOffers.length < input.maxHeldOffers) return true;
  const best = Math.max(
    0,
    ...input.heldOffers.map((offer) => offer.annualCtcInr ?? 0),
  );
  // Unknown CTC cannot prove the required upgrade over a held offer.
  if (best <= 0 || input.annualCtcInr === null) return false;
  return input.annualCtcInr >=
    Math.ceil(best * (100 + input.upliftPct) / 100);
}

/** Legacy's minimum-response clock skips Sunday in Asia/Kolkata. */
export function minimumOfferResponseDeadline(
  issuedAt: Date,
  minimumResponseHours: number,
): Date {
  if (!Number.isSafeInteger(minimumResponseHours) || minimumResponseHours < 1) {
    throw new Error("Invalid minimum response hours");
  }
  let cursor = issuedAt.getTime();
  let remaining = minimumResponseHours;
  while (remaining > 0) {
    cursor += 60 * 60 * 1000;
    // IST never observes DST; shifting to the local clock makes getUTCDay
    // deterministic even when the caller runs in another timezone.
    const istDay = new Date(cursor + 330 * 60 * 1000).getUTCDay();
    if (istDay !== 0) remaining -= 1;
  }
  return new Date(cursor);
}
