/**
 * P-S1-05: Legacy college held-offer cap with the higher-CTC uplift exception.
 *
 * Only official OFFER records that are ISSUED or ACCEPTED count as held.
 * LOIs, declined and withdrawn offers never count. A dream job bypasses the
 * cap, but the persisted isDream job classification needs the staged column.
 * Unknown CTC fails closed once the ordinary held-offer cap is reached.
 */
export type HeldPlacementOffer = {
  kind: string;
  status: string;
  annualCtcInr: number | null;
};

export function canAddPlacementHeldOffer(input: {
  maxHeldOffers: number;
  upliftPct: number;
  nextAnnualCtcInr: number | null;
  isDream: boolean;
  heldOffers: readonly HeldPlacementOffer[];
}): boolean {
  const held = input.heldOffers.filter(
    (offer) => offer.kind === "OFFER" &&
      (offer.status === "ISSUED" || offer.status === "ACCEPTED"),
  );

  if (held.length < input.maxHeldOffers || input.isDream) return true;

  const next = input.nextAnnualCtcInr;
  if (next === null || !Number.isSafeInteger(next) || next < 0) {
    return false;
  }
  const ctc = held.map((offer) => offer.annualCtcInr);
  if (ctc.some((value) =>
    value === null || !Number.isSafeInteger(value) || value < 0
  )) return false;

  const best = Math.max(...(ctc as number[]));
  if (!Number.isFinite(best) || input.maxHeldOffers < 1 ||
      input.upliftPct < 0) return false;
  return next * 100 >= best * (100 + input.upliftPct);
}
