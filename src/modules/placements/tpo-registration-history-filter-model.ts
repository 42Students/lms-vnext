import {z} from "zod";
export const tpoRegistrationHistoryQuery=z.object({
 source:z.enum(["ALL","SELF","TPO","BACKFILL"]).default("ALL"),
 event:z.enum(["ALL","INITIAL","CHANGE"]).default("ALL"),
}).strict();
export function filterTpoRegistrationEvents<T extends {source:string;previousChoice:string|null}>(rows:readonly T[],raw:z.infer<typeof tpoRegistrationHistoryQuery>):T[]{
 return rows.filter(row=>(raw.source==="ALL"||row.source===raw.source)&&
  (raw.event==="ALL"||(raw.event==="INITIAL"?row.previousChoice===null:row.previousChoice!==null)));
}
export function tpoRegistrationHistoryFilterHref(batchId:string,membershipId:string,filters:z.infer<typeof tpoRegistrationHistoryQuery>,exportCsv=false):string{
 const p=new URLSearchParams();
 if(filters.source!=="ALL")p.set("source",filters.source);
 if(filters.event!=="ALL")p.set("event",filters.event);
 const base="/tpo/batches/"+encodeURIComponent(batchId)+"/registrations/"+encodeURIComponent(membershipId)+"/history";
 const url=exportCsv?"/api/placements"+base+"/export":base;
 return url+(p.size?"?"+p.toString():"");
}
