export type BulkCandidate={learnerMembershipId:string;section:"EDUCATION"|"IDENTITY";status:"SUBMITTED"|"UPDATE_PENDING"|"VERIFIED"|"SENT_BACK";version:number};
export function previewVerificationBulk<T extends BulkCandidate>(rows:readonly T[],action:"VERIFY"|"SEND_BACK"){
 const seen=new Set<string>(),eligible:T[]=[],skipped:{row:T;reason:string}[]=[];
 for(const row of rows){
 const key=row.learnerMembershipId+":"+row.section;
 const reason=seen.has(key)?"DUPLICATE":(row.status!=="SUBMITTED"&&row.status!=="UPDATE_PENDING")?"NOT_WAITING":row.version<1?"INVALID_VERSION":null;
 seen.add(key);
 if(reason)skipped.push({row,reason});else eligible.push(row);
 }
 return {action,eligible,skipped,total:rows.length};
}
