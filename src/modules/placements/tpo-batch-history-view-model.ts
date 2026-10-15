import {z} from "zod";
export const batchHistoryViewSchema=z.object({kind:z.enum(["ALL","DECIDE","UNDO"]).default("ALL"),after:z.enum(["ALL","ELIGIBLE","INELIGIBLE","NOT_DECIDED"]).default("ALL")}).strict();
export function filterTpoBatchHistoryKind<T extends {kind:string}>(events:readonly T[],kind:"ALL"|"DECIDE"|"UNDO"):T[]{
 return kind==="ALL"?[...events]:events.filter(event=>event.kind===kind);
}
export function filterTpoBatchHistoryOutcome<T extends {after:string|null}>(events:readonly T[],after:"ALL"|"ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED"):T[]{
 return after==="ALL"?[...events]:events.filter(event=>(event.after??"NOT_DECIDED")===after);
}
export function batchHistoryHref(batchId:string,filters:{kind:string;after:string}):string{
 const p=new URLSearchParams();
 if(filters.kind!=="ALL")p.set("kind",filters.kind);
 if(filters.after!=="ALL")p.set("after",filters.after);
 return "/tpo/batches/"+encodeURIComponent(batchId)+"/history"+(p.size?"?"+p.toString():"");
}
