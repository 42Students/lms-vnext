import {tpoGeneralRequestCanApprove} from "./tpo-general-request-model";
import {tpoGeneralRequestReviewFacts} from "./tpo-general-request-review-facts";

export const MAX_GENERAL_REQUEST_BULK_DECISIONS=10;
export type GeneralRequestBulkAction="APPROVE"|"REJECT";
export type GeneralRequestBulkRow={
 id:string;kind:string;status:string;version:string;studentName:string|null;
 payload:Record<string,unknown>;
};

/** Local eligibility is UX only; every submitted decision is independently
 * re-authorized, version-checked and committed by the server. */
export function generalRequestBulkBlockReason(
 row:GeneralRequestBulkRow,action:GeneralRequestBulkAction,
):string|null{
 if(row.status!=="PENDING")return "Only waiting requests can be decided.";
 if(action!=="APPROVE")return null;
 // Restoring an externally reported acceptance changes the learner's offer
 // response window; require a deliberate one-request-at-a-time review.
 if(row.kind==="OFFER_ACCEPTANCE_DISPUTE")
  return "Review each external-acceptance dispute individually.";
 if(!tpoGeneralRequestCanApprove(row.kind))
  return "This request type requires specialist review before approval.";
 const evidence=tpoGeneralRequestReviewFacts(row.kind,row.payload);
 // The legacy bulk proof skip applies to off-campus offers; attendance
 // disputes can be corrected without an uploaded document.
 if(row.kind==="OFF_CAMPUS_OFFER"&&!evidence.proofUrl)
  return "Proof missing or unsafe: open this request for individual review.";
 return null;
}

export function planGeneralRequestBulk(
 rows:readonly GeneralRequestBulkRow[],selectedIds:readonly string[],action:GeneralRequestBulkAction,
){
 const ids=new Set(selectedIds);
 const selected=rows.filter(row=>ids.has(row.id));
 const kind=selected[0]?.kind??null;
 const error=ids.size===0?"Choose waiting requests to review.":
  ids.size>MAX_GENERAL_REQUEST_BULK_DECISIONS?
   "Choose at most "+MAX_GENERAL_REQUEST_BULK_DECISIONS+" requests.":
  selected.length!==ids.size?
   "Some selected requests have changed. Refresh the queue.":
  selected.some(row=>row.kind!==kind)?
   "Select requests of the same kind for each batch.":
  selected.map(row=>generalRequestBulkBlockReason(row,action)).find(Boolean)??null;
 return {requests:selected,kind,valid:error===null,error};
}
