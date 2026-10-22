/** Preview only; actual issuance remains permission-checked for each college lead. */
export type TpoBulkInviteCandidate={
 id:string;name:string;emailNorm:string|null;companyRelationshipId:string|null;
 recruiterUserId:string|null;unsubscribedAt:string|null;manualStage:string;
 inviteSentAt?:string|null;
};
export function bulkInviteDisposition(row:TpoBulkInviteCandidate){
 if(row.recruiterUserId)return "Already joined";
 if(row.unsubscribedAt)return "Asked not to be contacted";
 if(!row.emailNorm)return "No email on file";
 if(!row.companyRelationshipId)return "Company link missing";
 return null;
}
export function previewTpoBulkInvites(rows:readonly TpoBulkInviteCandidate[]){
 return rows.map(row=>({...row,skipReason:bulkInviteDisposition(row)}));
}
