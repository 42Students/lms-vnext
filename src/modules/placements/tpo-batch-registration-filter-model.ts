import {z} from "zod";
import {tpoRegistrationChoiceSchema} from "./tpo-batch-registration-summary-model";
export const tpoBatchRegistrationFilters=z.object({
 q:z.string().trim().max(100).default(""),
 choice:z.union([tpoRegistrationChoiceSchema,z.literal("UNRECORDED"),z.literal("ALL")]).default("ALL"),
 source:z.enum(["ALL","SELF","TPO","BACKFILL","UNRECORDED"]).default("ALL"),
 recency:z.enum(["ALL","UPDATED_7_DAYS","OLDER_30_DAYS","NO_RECORD"]).default("ALL"),
 order:z.enum(["NAME_ASC","NAME_DESC","UPDATED_NEWEST","UPDATED_OLDEST"]).default("NAME_ASC"),
 pageSize:z.coerce.number().int().refine(n=>[25,50,100].includes(n)).default(25),
 page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type BatchRegistrationListRow={membershipId:string;name:string;choice:string|null};
export function filterBatchRegistrations<T extends BatchRegistrationListRow>(
 rows:readonly T[],filter:Pick<z.infer<typeof tpoBatchRegistrationFilters>,"q"|"choice"|"page">,
){
 const search=filter.q.toLocaleLowerCase();
 return rows.filter(row=>{
  const matchesChoice=filter.choice==="ALL"||
   (filter.choice==="UNRECORDED"?row.choice===null:row.choice===filter.choice);
  const matchesSearch=row.name.toLocaleLowerCase().includes(search)||
   row.membershipId.toLowerCase().includes(search);
  return matchesChoice&&matchesSearch;
 });
}
export function paginateBatchRegistrations<T>(items:readonly T[],page:number,pageSize=25){
 return {items:items.slice((page-1)*pageSize,page*pageSize),
  page,total:items.length,hasMore:page*pageSize<items.length};
}
