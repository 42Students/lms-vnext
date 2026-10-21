import { z } from "zod";

// These controls can arrive as untrusted URL query values. Coercion of arrays,
// booleans, hexadecimal and exponents silently changes the operator's filters.
const decimalSelection = z.union([
 z.number().int(),
 z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int()),
]);
export const adminDriveDirectoryQuerySchema=z.object({
 q:z.string().trim().max(100).default(""),
 status:z.enum(["ALL","DRAFT","ACTIVE","CLOSED"]).default("ALL"),
 page:decimalSelection.refine(n=>n>=1&&n<=100000).default(1),
 pageSize:decimalSelection.refine(n=>[10,20,50,100].includes(n)).optional(),
 // Legacy Ant pagination used `size`; keep it as a validated alias.
 size:decimalSelection.refine(n=>[10,20,50,100].includes(n)).optional(),
}).strict().superRefine((value,ctx)=>{
 if(value.size!==undefined&&value.pageSize!==undefined&&value.size!==value.pageSize)
  ctx.addIssue({code:"custom",path:["size"],message:"Conflicting page sizes"});
}).transform(({size,pageSize,...filters})=>({...filters,pageSize:pageSize??size??20}));
type Drive={job:{id:string;title:string;status:string;applicationDeadline:Date|null;
 publishedAt?:Date|null;createdAt?:Date|null};company?:{name:string}};
export function filterAdminDriveDirectory<T extends Drive>(rows:readonly T[],
 query:z.infer<typeof adminDriveDirectoryQuerySchema>){
 const term=query.q.toLocaleLowerCase("en-IN");
 const all=rows.filter(row=>(query.status==="ALL"||
  (query.status==="ACTIVE"&&row.job.status==="PUBLISHED")||
  (query.status==="DRAFT"&&row.job.status==="DRAFT")||
  (query.status==="CLOSED"&&["CLOSED","CANCELLED"].includes(row.job.status)))&&
  (!term||(row.job.title+" "+(row.company?.name??"")).toLocaleLowerCase("en-IN").includes(term)))
  .sort((a,b)=>{
   // Legacy jobs listing places most recently posted drives first. A stable
   // UUID tie-break avoids pages shifting when two posting times are equal.
   const posted=(row:Drive)=>row.job.publishedAt?.getTime()??
    row.job.createdAt?.getTime()??0;
   return posted(b)-posted(a)||a.job.id.localeCompare(b.job.id);
  });
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
 if(query.pageSize!==20)url.set("pageSize",String(query.pageSize));
 const encoded=url.toString();
 return "/admin/placements/drives"+(encoded?"?"+encoded:"");
}
export function adminDriveStatus(job:{status:string;applicationDeadline:Date|null},now=new Date()){
 if(job.status==="PUBLISHED")return job.applicationDeadline&&job.applicationDeadline.getTime()<=now.getTime()?"Open · Expired":"Open";
 return job.status==="DRAFT"?"Draft":job.status==="CLOSED"?"Closed":job.status;
}

/** Super Admin directory dates are displayed in the owner's IST timezone. */
export function adminDriveIstDate(value:Date|null|undefined):string {
 if(!value||!Number.isFinite(value.getTime()))return "—";
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
 }).format(value);
}
