import { z } from "zod";
export const tenantReadQuerySchema = z.object({
 q:z.string().trim().max(100).default(""),
 organizationId:z.union([z.string().uuid(),z.literal("")]).default(""),
 page:z.coerce.number().int().min(1).max(1000).default(1),
}).strict();
export function tenantPage<T extends {name:string;code:string;organizationName:string;organizationId:string}>(
 rows:readonly T[],query:z.infer<typeof tenantReadQuerySchema>) {
 const q=query.q.toLocaleLowerCase("en-IN");
 const filtered=rows.filter(x=>(!query.organizationId||x.organizationId===query.organizationId)&&
  (!q||[x.name,x.code,x.organizationName].some(s=>s.toLocaleLowerCase("en-IN").includes(q))));
 const start=(query.page-1)*20;
 return {items:filtered.slice(start,start+20),total:filtered.length,totalPages:Math.max(1,Math.ceil(filtered.length/20))};
}
