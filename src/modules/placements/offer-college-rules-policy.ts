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
  if (!Number.isSafeInteger(minimumResponseHours) ||
      minimumResponseHours < 1 || minimumResponseHours > 24 * 366 ||
      !Number.isFinite(issuedAt.getTime())) {
    throw new Error("Invalid minimum response hours");
  }
  // Credit the exact elapsed milliseconds within each IST civil day. A whole
  // hour ending at Monday 00:30 can contain 30 minutes of Sunday, which must
  // NOT be counted toward the minimum response window.
  const dayMs = 86_400_000, indiaOffsetMs = 330 * 60_000;
  let cursor = issuedAt.getTime();
  let remainingMs = minimumResponseHours * 3_600_000;
  while (remainingMs > 0) {
    const local = cursor + indiaOffsetMs;
    const day = new Date(local).getUTCDay();
    const elapsed = ((local % dayMs) + dayMs) % dayMs;
    const untilMidnight = dayMs - elapsed;
    if (day === 0) {
      cursor += untilMidnight;
      continue;
    }
    const credit = Math.min(untilMidnight, remainingMs);
    cursor += credit;
    remainingMs -= credit;
  }
  return new Date(cursor);
}

/** D5: an offer cannot be accepted or declined at its exact expiry instant. */
export function isPlacementOfferResponseExpired(
  expiresAt: Date | null,
  now: Date,
): boolean {
  return expiresAt !== null && (!Number.isFinite(expiresAt.getTime()) ||
    !Number.isFinite(now.getTime()) || now.getTime() >= expiresAt.getTime());
}


/** Placement offer acceptance must use the later of the caller's request
 * instant and the actual time at which the offer row lock is acquired.
 * Otherwise a response waiting on a competing transaction can cross its
 * expiry and still be accepted as if it were received before the deadline.
 */
export function placementOfferLockedDecisionTime(requestTime:Date,lockedAt:Date):Date{
 const a=requestTime.getTime(),b=lockedAt.getTime();
 if(!Number.isFinite(a)||!Number.isFinite(b))throw new Error("Invalid offer decision clock");
 return new Date(Math.max(a,b));
}
