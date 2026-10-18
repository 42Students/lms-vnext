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

/** PostgreSQL can abort either contender of a serializable, job-row-locked
 * offer issue. Surface a safe version conflict, not SQLSTATE/provider text.
 */
export function isPlacementIssuanceConcurrencyError(error:unknown):boolean {
  const visited=new Set<unknown>();
  let current:unknown=error;
  for(let i=0;i<5&&current!==null&&typeof current==="object";i++){
    if(visited.has(current))return false;
    visited.add(current);
    const code="code" in current?current.code:undefined;
    if(code==="40001"||code==="40P01")return true;
    current="cause" in current?current.cause:undefined;
  }
  return false;
}
