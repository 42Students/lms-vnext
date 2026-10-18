/** A visibility change uses only server-authorized filtered learner IDs,
 * including selected learners on other roster pages when the entire filtered
 * view is safely available. Never use IDs from untrusted browser storage. */
export function tpoDriveVisibilitySelection<T extends {id:string}>(
 selected:readonly string[],learners:readonly T[],limit:number,
):T[]{
 const ids=new Set(selected);
 return learners.filter(row=>ids.has(row.id)).slice(0,limit);
}
export function tpoDriveVisibilityValid(input:{
 jobId:string;decision:"INCLUDE"|"EXCLUDE"|"CLEAR";reason:string;count:number;
}):boolean{
 return input.jobId.length>0&&input.count>0&&input.count<=200&&
  input.reason.trim().length>=3&&input.reason.trim().length<=500;
}
