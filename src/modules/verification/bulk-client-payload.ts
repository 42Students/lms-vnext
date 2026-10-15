import {previewVerificationBulk,type BulkCandidate} from "./bulk-preview";
export function collegeBulkReviewPayload(rows:readonly BulkCandidate[],action:"VERIFY"|"SEND_BACK",reason?:string){
 const selection=previewVerificationBulk(rows,action);
 return {confirm:true as const,action,
  items:selection.eligible.slice(0,20).map(item=>({
   learnerMembershipId:item.learnerMembershipId,section:item.section,expectedVersion:item.version
  })),...(action==="SEND_BACK"?{reason:reason?.trim()??""}:{})
 };
}
