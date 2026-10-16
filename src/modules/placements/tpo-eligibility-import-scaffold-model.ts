/** Authorized current-page learner roll codes; ambiguous/unsafe codes fall back to UUIDs. */
export function buildTpoEligibilityImportScaffold(rows:readonly {membershipId:string;rollNumber?:string|null}[]):string{
 const unique=rows.filter((row,index)=>rows.findIndex(other=>other.membershipId===row.membershipId)===index);
 const counts=new Map<string,number>();
 for(const row of unique){
  const code=row.rollNumber?.trim().toLowerCase();
  if(code)counts.set(code,(counts.get(code)??0)+1);
 }
 const codes=unique.map(row=>{
  const roll=row.rollNumber?.trim()??"";
  if(!roll||counts.get(roll.toLowerCase())!==1||/^[\s\uFEFF]*[=+@\-]/u.test(roll)||
   /[,\r\n"]/.test(roll))return row.membershipId;
  return roll;
 });
 return "studentCode,decision,reason\r\n"+codes.map(code=>code+",,").join("\r\n")+(codes.length?"\r\n":"");
}
export function tpoEligibilityImportScaffoldHref(batchId:string,page:number):string{
 return "/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/students/import-scaffold?page="+page;
}
