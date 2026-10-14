export type HrOfferRead = {
  id: string; applicationId:string; status:string; expiresAt:Date|null;
  joiningStatus:string|null;
};
/**
 * All values are persisted offer rows, not unique learners. LOI has no registered
 * record type and therefore cannot be fabricated by this read-only model.
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
  const firstRound=evaluative[0]!;
  const qualified=new Set(
    firstRound.participants.filter(person=>person.result?.status==="APPLIED" &&
      person.result.outcome==="PASS").map(person=>person.applicationId),
  );
  for(const round of evaluative.slice(1)) {
    const passed=new Set(round.participants.filter(person=>
      person.result?.status==="APPLIED" && person.result.outcome==="PASS",
    ).map(person=>person.applicationId));
    for(const applicationId of qualified) {
      if(!passed.has(applicationId)) qualified.delete(applicationId);
    }
  }
  return [...qualified];
}
