/** Exactly one pending matching member/kind/target survives duplicate
 * concurrent requests; retries after a decided result create a new audit row. */
export function requestDeduplicationText(state:"PENDING"|"APPROVED"|"REJECTED"|"CANCELLED"){
 return state==="PENDING"?"An identical request is already waiting for a decision.":
  "This earlier request was decided. You can submit updated evidence.";
}
export function legacyEscalationUtc(raw:string|null){
 if(!raw||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(raw))return null;
 const parsed=new Date(raw+"+05:30");
 return Number.isFinite(parsed.getTime())?parsed:null;
}
export function historicalRequestReason(raw:string|null){
 return raw?.trim().slice(0,2000)||"No reason recorded";
}
