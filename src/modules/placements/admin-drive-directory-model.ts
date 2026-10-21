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
/** Deliberate legacy-to-vNext projection: legacy active/draft flags are
 * read from persisted vNext status, not guessed by date or UI filters. */
export const LEGACY_ADMIN_DRIVE_STATUS = {
 ACTIVE:"PUBLISHED",DRAFT:"DRAFT",CLOSED:"CLOSED",
} as const;
type Drive={job:{id:string;title:string;status:string;applicationDeadline:Date|null;
 publishedAt?:Date|null;createdAt?:Date|null;legacyPostedAt?:Date|null;
 legacyPostingDetails?:{importantDates?:readonly {label:string;at:string}[]}|null};
 company?:{name:string}};
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
    row.job.legacyPostedAt?.getTime()??row.job.createdAt?.getTime()??0;
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
/** Accept only the legacy IST local timestamp shape; do not interpret
 * it using the browser/server machine's current timezone. */
export function adminDriveIstLocalToInstant(value:string):Date|null{
 const match=/^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?$/.exec(value);
 if(!match)return null;
 const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
 const hour=Number(match[4]),minute=Number(match[5]),second=Number(match[6]??0);
 const instant=new Date(Date.UTC(year,month-1,day,hour,minute,second)-330*60_000);
 const check=new Date(instant.getTime()+330*60_000);
 return check.getUTCFullYear()===year&&check.getUTCMonth()+1===month&&
  check.getUTCDate()===day&&check.getUTCHours()===hour&&
  check.getUTCMinutes()===minute&&check.getUTCSeconds()===second?instant:null;
}

/** Imported importantDates is a display fallback only; the canonical stored
 * applicationDeadline wins whenever available. */
export function adminDriveEffectiveDeadline(job:Drive["job"]):Date|null{
 if(job.applicationDeadline)return job.applicationDeadline;
 const legacy=job.legacyPostingDetails?.importantDates?.find(item=>
  item.label.trim().toLowerCase()==="application deadline");
 if(!legacy)return null;
 const parsed=legacy.at.includes("Z")||/[+-][0-9]{2}:[0-9]{2}$/.test(legacy.at)
  ?new Date(legacy.at):adminDriveIstLocalToInstant(legacy.at);
 return parsed&&Number.isFinite(parsed.getTime())?parsed:null;
}

/** Safe legacy query adapter. Invalid old filter options become All/20, not
 * a broad authorization fallback: the caller must still scope the DB read. */
export function parseLegacyAdminDriveDirectoryQuery(raw:Record<string,unknown>){
 const numberOrDefault=(value:unknown,fallback:number)=>{
  if(typeof value==="number"&&Number.isInteger(value))return value;
  if(typeof value==="string"&&/^[0-9]+$/.test(value))return Number(value);
  return fallback;
 };
 const size=numberOrDefault(raw.pageSize??raw.size,20);
 const page=numberOrDefault(raw.page,1);
 return adminDriveDirectoryQuerySchema.parse({
  q:typeof raw.q==="string"?raw.q.slice(0,100):"",
  status:["ALL","DRAFT","ACTIVE","CLOSED"].includes(String(raw.status))
   ?raw.status:"ALL",
  page:Math.max(1,Math.min(100000,page)),
  pageSize:[10,20,50,100].includes(size)?size:20,
 });
}

/** Legacy Ant moment comparison expires only when the deadline minute passes. */
export function adminDriveIsExpired(deadline:Date|null|undefined,now=new Date()):boolean {
 return Boolean(deadline&&Number.isFinite(deadline.getTime())&&
  Math.floor(deadline.getTime()/60_000)<Math.floor(now.getTime()/60_000));
}
export function adminDriveStatus(job:Drive["job"],now=new Date()){
 if(job.status==="PUBLISHED")return adminDriveIsExpired(adminDriveEffectiveDeadline(job),now)?"Open · Expired":"Open";
 return job.status==="DRAFT"?"Draft":job.status==="CLOSED"?"Closed":job.status;
}

/** Super Admin directory dates are displayed in the owner's IST timezone. */
export function adminDriveIstDate(value:Date|null|undefined):string {
 if(!value||!Number.isFinite(value.getTime()))return "—";
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
 }).format(value);
}
