export function learnerVerificationSubmissionFeedback(status:number,code:unknown):{message:string;refreshRequired:boolean}{
 if(status===409&&code==="STALE_VERSION")return {
  message:"This verification record changed. Refresh to review the latest version before resubmitting.",refreshRequired:true
 };
 if(status===409&&code==="NOTHING_CHANGED")return {
  message:"No new evidence was submitted. Save your updated details or documents, then refresh the verification state.",refreshRequired:true
 };
 if(status===422&&code==="INCOMPLETE_DOCUMENTS")return {
  message:"The private evidence is incomplete or has not passed the required storage and scan checks.",refreshRequired:false
 };
 if(status===404)return {message:"Your verification request is not available for this account.",refreshRequired:false};
 return {message:"Submission could not be completed. Please retry.",refreshRequired:false};
}
