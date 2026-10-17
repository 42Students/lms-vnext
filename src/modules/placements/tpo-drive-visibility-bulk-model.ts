/** A bulk visibility action never acts on students hidden by the visible roster page. */
export function tpoDriveVisibilitySelection<T extends {id:string}>(
 selected:readonly string[],learners:readonly T[],limit:number,
):T[]{
 const ids=new Set(selected);
 return learners.filter(row=>ids.has(row.id)).slice(0,limit);
}
export function tpoDriveVisibilityValid(input:{
 jobId:string;decision:"INCLUDE"|"EXCLUDE"|"CLEAR";reason:string;count:number;
}):boolean{
 return input.jobId.length>0&&input.count>0&&input.count<=25&&
  input.reason.trim().length>=3&&input.reason.trim().length<=500;
}
