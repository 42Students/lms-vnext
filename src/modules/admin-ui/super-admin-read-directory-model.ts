import { z } from "zod";
export const SUPER_ADMIN_READ_PAGE_SIZE = 25;
// Directory handlers are called from URLs and trusted internal code. Admit
// ordinary integers/decimal strings, never hex, exponent, blank or arrays.
const strictDecimal=(min:number,max:number,fallback:number)=>z.union([
 z.number().int().min(min).max(max),
 z.string().regex(/^[0-9]+$/).transform(Number)
   .pipe(z.number().int().min(min).max(max)),
]).default(fallback);
export const superAdminReadQuerySchema = z.strictObject({
 q: z.string().trim().max(100).default(""),
 status: z.enum(["ALL","ACTIVE","INACTIVE","PLANNED","COMPLETED","ARCHIVED","ENDED","SUSPENDED","SUBMITTED","WITHDRAWN","PENDING","SCHEDULED","CANCELLED","HOLD","SHORTLISTED","REJECTED","ISSUED","ACCEPTED","DECLINED","JOINED","DID_NOT_JOIN","DEFERRED","CLOSED","DRAFT","PUBLISHED"]).default("ALL"),
 page: strictDecimal(1,1000,1),
 pageSize: strictDecimal(10,200,25).refine(n=>[10,25,50,100,200].includes(n)),
 jobId: z.string().uuid().optional(),
 source:z.enum(["ALL","INTERNAL","EXTERNAL"]).default("ALL"),
 channel:z.enum(["ALL","INTERNAL","EXTERNAL"]).default("ALL"),
 pipelineStage:z.enum(["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED"]).default("ALL"),
 departmentId:z.uuid().optional(),
 programId:z.uuid().optional(),
 cohortId:z.uuid().optional(),
 sectionId:z.uuid().optional(),
 employmentType:z.string().trim().max(128).optional(),
});
export type SuperAdminReadQuery = z.infer<typeof superAdminReadQuerySchema>;
export type SuperAdminReadRow = {
 id:string; title:string; subtitle:string; details:readonly string[];
 /** Server-issued optimistic token for editable directory rows. */
 revision?:string;
 status:string; href?:string;secondaryHref?:string;secondaryLabel?:string;
};
export type SuperAdminReadResult = {
 query:SuperAdminReadQuery; total:number; totalPages:number; items:SuperAdminReadRow[];
};
export function superAdminReadPages(total:number,pageSize=SUPER_ADMIN_READ_PAGE_SIZE) {
 // This helper is exported to internal callers as well as parsed routes.
 // Never manufacture NaN/Infinity page counts from malformed counts or zero
 // page sizes (which otherwise produce infinite "Next" navigation).
 const rows=Number.isFinite(total)&&total>0?Math.floor(total):0;
 const size=Number.isSafeInteger(pageSize)&&pageSize>0?pageSize:SUPER_ADMIN_READ_PAGE_SIZE;
 return Math.max(1,Math.ceil(rows/size));
}
export function superAdminReadHref(path:string,query:SuperAdminReadQuery) {
 const params=new URLSearchParams();
 if(query.q)params.set("q",query.q);
 if(query.jobId)params.set("jobId",query.jobId);
 if(query.pipelineStage!=="ALL")params.set("pipelineStage",query.pipelineStage);
 if(query.source!=="ALL")params.set("source",query.source);
 if(query.channel!=="ALL")params.set("channel",query.channel);
 for(const key of ["departmentId","programId","cohortId","sectionId","employmentType"] as const){if(query[key])params.set(key,query[key]);}
 if(query.status!=="ALL")params.set("status",query.status);
 if(query.page>1)params.set("page",String(query.page));
 if(query.pageSize!==25)params.set("pageSize",String(query.pageSize));
 return path+(params.size?"?"+params:"");
}
export function readAdminQuery(raw:Record<string,string|string[]|undefined>) {
 // Unknown URL keys and repeated values are ambiguous. An old or forged
 // query must render the page's invalid-filters recovery, not silently
 // discard the attempted scope or pick the first value.
 const allowed=["q","status","page","pageSize","jobId","pipelineStage",
  "source","channel","departmentId","programId","cohortId","sectionId","employmentType"];
 if(Object.keys(raw).some(key=>!allowed.includes(key)) ||
    Object.values(raw).some(Array.isArray))
  return superAdminReadQuerySchema.safeParse(null);
 return superAdminReadQuerySchema.safeParse({q:raw.q,status:raw.status,page:raw.page,pageSize:raw.pageSize,jobId:raw.jobId,pipelineStage:raw.pipelineStage,source:raw.source,channel:raw.channel,departmentId:raw.departmentId,programId:raw.programId,cohortId:raw.cohortId,sectionId:raw.sectionId,employmentType:raw.employmentType});
}
export function scopedSearchLike(q:string) {
 return "%"+q.replace(/[\\%_]/g,"\\$&")+"%";
}
