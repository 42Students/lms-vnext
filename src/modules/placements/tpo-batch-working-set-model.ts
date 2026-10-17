/** TPO-batches-07: keep finished and never-used, passed-out batches out of
 * the default working set without deleting them or hiding explicit searches. */
export function tpoBatchIsOlder(row:{finishedAt:Date|null;invitedAt:Date|null;
 endYear:number|null},currentYear:number):boolean{
 return Boolean(row.finishedAt)||
  (row.invitedAt===null&&row.endYear!==null&&row.endYear<currentYear);
}
export function visibleTpoBatchWorkingSet<T extends {finishedAt:Date|null;
 invitedAt:Date|null;endYear:number|null}>(
 rows:readonly T[],currentYear:number,showOlder:boolean,explicitSearch=false,
):{visible:T[];hidden:number}{
 if(showOlder||explicitSearch)return {visible:[...rows],hidden:0};
 const visible=rows.filter(row=>!tpoBatchIsOlder(row,currentYear));
 return {visible,hidden:rows.length-visible.length};
}
