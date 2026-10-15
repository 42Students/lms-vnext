import {z} from "zod";
import type {ProjectResourceFile} from "./resource-file-list-model";
export const resourceFileFilterSchema=z.object({
 search:z.string().trim().max(120).default(""),
 state:z.enum(["ALL","AVAILABLE","PENDING","BLOCKED"]).default("ALL"),
 order:z.enum(["NEWEST","OLDEST","NAME"]).default("NEWEST"),
 page:z.number().int().min(1).max(10000).default(1),
 pageSize:z.number().int().min(1).max(50).default(20),
}).strict();
export type ResourceFileFilter=z.infer<typeof resourceFileFilterSchema>;
export function filteredResourceFiles(rows:readonly ProjectResourceFile[],raw:unknown){
 const query=resourceFileFilterSchema.parse(raw);
 const term=query.search.toLocaleLowerCase("en-IN");
 const selected=rows.filter(row=>row.status!=="DELETED"&&
  (!term||row.name.toLocaleLowerCase("en-IN").includes(term))&&
  (query.state==="ALL"||
   (query.state==="AVAILABLE"&&row.status==="READY")||
   (query.state==="PENDING"&&["QUEUED","UPLOADING","VERIFYING"].includes(row.status))||
   (query.state==="BLOCKED"&&["QUARANTINED","FAILED"].includes(row.status))))
  .sort((a,b)=>query.order==="NAME"?
   a.name.localeCompare(b.name)||a.id.localeCompare(b.id):
   query.order==="OLDEST"?
   a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id):
   b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));
 const pages=Math.max(1,Math.ceil(selected.length/query.pageSize)),page=Math.min(query.page,pages);
 return {query,total:selected.length,page,pages,items:selected.slice((page-1)*query.pageSize,page*query.pageSize)};
}
