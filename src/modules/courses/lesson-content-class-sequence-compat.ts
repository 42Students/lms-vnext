/** Legacy lesson_content_class_sequence is per class, while vNext is per
 * authorized delivery. This projection must only receive scoped rows after
 * an authorized lesson+delivery read; it never resolves raw legacy class IDs. */
export type LegacySequencedContent={
 id:string;sequence:number;deliveryId:string|null;visibleToStudents:boolean;
 status:string;createdAt:Date;
};
export function projectLegacyVisibleContentOrder<T extends LegacySequencedContent>(
 rows:readonly T[],deliveryId:string,
 overrides:ReadonlyMap<string,number>|null,
 runtimeReady:boolean,
){
 const visible=rows.filter(row=>row.status!=="ARCHIVED"&&row.visibleToStudents&&
   (row.deliveryId===null||row.deliveryId===deliveryId));
 if(!runtimeReady&&overrides?.size)return {
  status:"ORDER_UNAVAILABLE" as const,items:[] as T[],
  message:"Content order is temporarily unavailable. Refresh after the migration is ready.",
 };
 if(overrides){
  const valid=visible.length===overrides.size&&visible.every(row=>{
   const n=overrides.get(row.id);return n!==undefined&&Number.isSafeInteger(n)&&n>=0;
  });
  if(!valid)return {status:"ORDER_UNAVAILABLE" as const,items:[] as T[],
   message:"The class content order changed. Reload before editing."};
 }
 const items=[...visible].sort((a,b)=>(overrides?.get(a.id)??a.sequence)-
    (overrides?.get(b.id)??b.sequence)||
     a.createdAt.getTime()-b.createdAt.getTime()||a.id.localeCompare(b.id));
 return {status:"READY" as const,items,message:null};
}
