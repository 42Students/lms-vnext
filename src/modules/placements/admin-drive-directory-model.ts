import { z } from "zod";
/** URL paging accepts only plain base-10 integers, never JS numeric coercions. */
const strictUrlInteger = (maximum: number) => z.union([
 z.number().int().min(1).max(maximum),
 z.string().regex(/^[1-9][0-9]*$/).transform(Number).pipe(z.number().int().min(1).max(maximum)),
]);
const strictDrivePageSize = z.union([
 z.number().int(),
 z.string().regex(/^(10|20|50|100)$/).transform(Number),
]).refine(value => [10,20,50,100].includes(value));
export const adminDriveDirectoryQuerySchema=z.object({
 q:z.string().trim().max(100).default(""),
 status:z.enum(["ALL","DRAFT","ACTIVE","CLOSED"]).default("ALL"),
 page:strictUrlInteger(100000).default(1),
 pageSize:strictDrivePageSize.default(10),
}).strict();
type Drive={job:{id:string;title:string;status:string;applicationDeadline:Date|null};company?:{name:string}};
export function filterAdminDriveDirectory<T extends Drive>(rows:readonly T[],
 query:z.infer<typeof adminDriveDirectoryQuerySchema>){
 const term=query.q.toLocaleLowerCase("en-IN");
 const all=rows.filter(row=>(query.status==="ALL"||
  (query.status==="ACTIVE"&&row.job.status==="PUBLISHED")||
  (query.status==="DRAFT"&&row.job.status==="DRAFT")||
  (query.status==="CLOSED"&&["CLOSED","CANCELLED"].includes(row.job.status)))&&
  (!term||(row.job.title+" "+(row.company?.name??"")).toLocaleLowerCase("en-IN").includes(term)));
 const totalPages=Math.max(1,Math.ceil(all.length/query.pageSize));
 const page=Math.min(query.page,totalPages);
 return {items:all.slice((page-1)*query.pageSize,page*query.pageSize),
  total:all.length,page,totalPages};
}
export function adminDriveDirectoryHref(query:z.infer<typeof adminDriveDirectoryQuerySchema>){
 const url=new URLSearchParams();
 if(query.q)url.set("q",query.q);
 if(query.status!=="ALL")url.set("status",query.status);
 if(query.page>1)url.set("page",String(query.page));
 if(query.pageSize!==10)url.set("pageSize",String(query.pageSize));
 const encoded=url.toString();
 return "/admin/placements/drives"+(encoded?"?"+encoded:"");
}
export function adminDriveStatus(job:{status:string;applicationDeadline:Date|null},now=new Date()){
 if(job.status==="PUBLISHED")return job.applicationDeadline&&job.applicationDeadline.getTime()<now.getTime()?"Open · Expired":"Open";
 return job.status==="DRAFT"?"Draft":job.status==="CLOSED"?"Closed":job.status;
}

/** Super Admin directory dates are displayed in the owner's IST timezone. */
export function adminDriveIstDate(value:Date|null|undefined):string {
 if(!value||!Number.isFinite(value.getTime()))return "—";
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
 }).format(value);
}
