export type HrOfferRead = {
  id: string; applicationId:string; status:string; expiresAt:Date|null;
  joiningStatus:string|null;
};
/**
 * All values are persisted offer rows (kind OFFER or LOI), not unique learners.
 */
export function buildHrOfferOverview(
  offers: readonly HrOfferRead[], now: Date,
) {
  return {
    recorded:offers.length,
    issued:offers.filter(offer=>offer.status==="ISSUED").length,
    accepted:offers.filter(offer=>offer.status==="ACCEPTED").length,
    declined:offers.filter(offer=>offer.status==="DECLINED").length,
    joined:offers.filter(offer=>offer.status==="ACCEPTED" && offer.joiningStatus==="JOINED").length,
    awaitingReply:offers.filter(offer=>offer.status==="ISSUED" &&
      (offer.expiresAt===null || offer.expiresAt.getTime()>=now.getTime())).length,
    overdue:offers.filter(offer=>offer.status==="ISSUED" &&
      offer.expiresAt!==null && offer.expiresAt.getTime()<now.getTime()).length,
  };
}
export type HrRoundRead = {
  kind:string; status:string;
  participants: readonly {applicationId:string;
    result:{status:string;outcome:string}|null}[];
};
/** Eligibility to discuss selections is derived from APPLIED PASS for every
 * evaluative round; unconfigured/pending rounds cannot be treated as passes. */
export function hrSelectionReadyApplicationIds(rounds: readonly HrRoundRead[]) {
  const evaluative=rounds.filter(round=>round.kind!=="TALK");
  if(evaluative.length===0 || evaluative.some(round=>round.status!=="COMPLETED")) return [];
  // A duplicate candidate/result projection is ambiguous. One PASS row
  // must not override another unrecorded, failed or staged result.
  const uniquelyPassed=(round:HrRoundRead)=>{
    const seen=new Map<string,number>();
    const passes=new Set<string>();
    for(const person of round.participants){
      if(!person.applicationId.trim())continue;
      seen.set(person.applicationId,(seen.get(person.applicationId)??0)+1);
      if(person.result?.status==="APPLIED"&&person.result.outcome==="PASS")
        passes.add(person.applicationId);
    }
    return new Set([...passes].filter(id=>seen.get(id)===1));
  };
  const qualified=uniquelyPassed(evaluative[0]!);
  for(const round of evaluative.slice(1)){
    const passed=uniquelyPassed(round);
    for(const applicationId of qualified)
      if(!passed.has(applicationId))qualified.delete(applicationId);
  }
  return [...qualified];
}
