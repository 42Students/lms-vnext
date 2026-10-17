/** TPO-batches-09: rank active placement batches above empty and finished
 * history; within each group favor the most recent passing-out year. */
export function sortTpoBatchWorkingPriority<T extends {
 id:string;name:string;finishedAt:Date|null;endYear:number|null;
}>(rows:readonly T[],counts:ReadonlyMap<string,{eligible:number;assessed:number}>):T[]{
 const priority=(row:T)=>{
  if(row.finishedAt)return 3;
  const info=counts.get(row.id);
  if((info?.eligible??0)>0)return 0;
  if((info?.assessed??0)>0)return 1;
  return 2;
 };
 return [...rows].sort((a,b)=>priority(a)-priority(b)||
   (b.endYear??0)-(a.endYear??0)||
   a.name.localeCompare(b.name,"en-IN")||a.id.localeCompare(b.id));
}
