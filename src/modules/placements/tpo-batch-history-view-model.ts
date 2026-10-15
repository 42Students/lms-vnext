import {z} from "zod";
export const batchHistoryViewSchema=z.object({kind:z.enum(["ALL","DECIDE","UNDO"]).default("ALL")}).strict();
export function filterTpoBatchHistoryKind<T extends {kind:string}>(events:readonly T[],kind:"ALL"|"DECIDE"|"UNDO"):T[]{
 return kind==="ALL"?[...events]:events.filter(event=>event.kind===kind);
}
export function batchHistoryHref(batchId:string,filters:{kind:string}):string{
 const p=new URLSearchParams();
 if(filters.kind!=="ALL")p.set("kind",filters.kind);
 return "/tpo/batches/"+encodeURIComponent(batchId)+"/history"+(p.size?"?"+p.toString():"");
}
