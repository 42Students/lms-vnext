export type VerificationReviewResult={ok:true;nextVersion:number}|{ok:false;code:"STALE_VERSION"|"NOT_ALLOWED"|"INCOMPLETE_DOCUMENTS"|"REASON_REQUIRED"|"NETWORK_ERROR"};
export function describeVerificationReviewResult(result:VerificationReviewResult):string{
 if(result.ok)return "Verification decision saved";
 switch(result.code){
 case "STALE_VERSION":return "This request changed. Refresh it before deciding.";
 case "NOT_ALLOWED":return "You cannot review this learner request.";
 case "INCOMPLETE_DOCUMENTS":return "Required private documents have not passed validation.";
 case "REASON_REQUIRED":return "Provide a reason before sending this request back.";
 case "NETWORK_ERROR":return "The decision was not confirmed. Retry after refreshing.";
 }
}
