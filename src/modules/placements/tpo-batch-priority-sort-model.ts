/** TPO-batches-09: rank active placement batches above empty and finished
 * history; within each group favor the most recent passing-out year. */
export function sortTpoBatchWorkingPriority<T extends {
 id:string;name:string;finishedAt:Date|null;endYear:number|null;
 state?:string|null;studentCount?:number|null;
}>(rows:readonly T[],counts:ReadonlyMap<string,{eligible:number;assessed:number}>):T[]{
 const priority=(row:T)=>{
  if(row.finishedAt||row.state==="FINISHED")return 3;
  if(row.state==="IN_PLACEMENTS")return 0;
  if(typeof row.studentCount==="number")
    return row.studentCount>0?1:2;
  const info=counts.get(row.id);
  return (info?.eligible??0)>0||(info?.assessed??0)>0?1:2;
 };
 return [...rows].sort((a,b)=>priority(a)-priority(b)||
   (b.endYear??0)-(a.endYear??0)||
   a.name.localeCompare(b.name,"en-IN")||a.id.localeCompare(b.id));
}
