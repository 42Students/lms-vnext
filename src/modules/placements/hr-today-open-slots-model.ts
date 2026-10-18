/** Derive actionable slot proposals from the already college- and job-scoped
 * interview rounds. Recheck currently offered/booked slots after the query:
 * a slot may have been offered between the initial anti-join and this read.
 */
export function recruiterTodayRoundsNeedingSlots<T extends {id:string}>(
 rounds:readonly T[],slots:readonly {roundId:string;status:string}[],
):Array<T&{needsOffer:boolean}>{
 const covered=new Set(slots.filter(slot=>
  slot.status==="OFFERED"||slot.status==="BOOKED").map(slot=>slot.roundId));
 const proposed=new Set(slots.filter(slot=>
  slot.status==="PROPOSED").map(slot=>slot.roundId));
 return rounds.filter(round=>!covered.has(round.id)).slice(0,8)
  .map(round=>({...round,needsOffer:proposed.has(round.id)}));
}
