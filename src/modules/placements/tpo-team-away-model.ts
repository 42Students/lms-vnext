/** Expired away slots are not active and must not block a new absence. */
export function tpoEffectiveAwayUntil(current:Date|null,now:Date){
 return current&&current.getTime()>now.getTime()?current.toISOString():null;
}
