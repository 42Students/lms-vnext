/**
 * A published drive's opening count is a hard ceiling on active official
 * offers, including seats temporarily reserved for a waitlist promotion.
 * A candidate's own PENDING reservation is consumed by the offer being issued,
 * so it must not be counted twice.
 */
export function hasAvailablePlacementOfferSeat(input: {
  openings: number | null;
  activeOfferCount: number;
  otherPendingReservations: number;
}): boolean {
  const {openings,activeOfferCount,otherPendingReservations}=input;
  if(!Number.isSafeInteger(activeOfferCount)||activeOfferCount<0||
     !Number.isSafeInteger(otherPendingReservations)||otherPendingReservations<0)
    return false;
  if(openings===null)return true;
  return Number.isSafeInteger(openings)&&openings>0&&
    activeOfferCount+otherPendingReservations<openings;
}
