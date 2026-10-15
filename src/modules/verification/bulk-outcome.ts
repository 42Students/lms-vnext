export type BulkReviewOutcome={
 learnerMembershipId:string;section:"EDUCATION"|"IDENTITY";
 result:"VERIFIED"|"SENT_BACK"|"STALE_VERSION"|"NOT_AVAILABLE"|"INCOMPLETE_DOCUMENTS"|"INVALID_TRANSITION"|"REASON_REQUIRED";
};
export function summarizeBulkReviews(rows:readonly BulkReviewOutcome[]){
 const succeeded=rows.filter(row=>row.result==="VERIFIED"||row.result==="SENT_BACK").length;
 return {attempted:rows.length,succeeded,failed:rows.length-succeeded};
}
export function bulkReviewFailureLabel(code:BulkReviewOutcome["result"]):string{
 switch(code){
  case "STALE_VERSION":return "Changed since selection; refresh before retrying";
  case "NOT_AVAILABLE":return "No longer available to review";
  case "INCOMPLETE_DOCUMENTS":return "Required documents have not passed verification";
  case "INVALID_TRANSITION":return "Request is no longer waiting";
  case "REASON_REQUIRED":return "A correction reason is required";
  default:return "Decision saved";
 }
}
