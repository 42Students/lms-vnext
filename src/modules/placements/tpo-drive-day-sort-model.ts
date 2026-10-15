import {z} from "zod";
export const tpoDriveDaySortSchema=z.enum(["RECENT","PENDING_DESC","NO_SHOW_DESC","UNRESOLVED_DESC"]).default("RECENT");
export function sortTpoDriveDayRows<T extends {id:string;companyName:string;counts:{pending:number;noShow:number;unknown:number}}>(
 rows:readonly T[],sort:z.infer<typeof tpoDriveDaySortSchema>
):T[]{
 if(sort==="RECENT")return [...rows];
 const score=(row:T)=>sort==="PENDING_DESC"?row.counts.pending:sort==="UNRESOLVED_DESC"?row.counts.pending+row.counts.unknown:row.counts.noShow;
 return [...rows].sort((a,b)=>score(b)-score(a)||a.companyName.localeCompare(b.companyName,"en-IN")||a.id.localeCompare(b.id));
}
