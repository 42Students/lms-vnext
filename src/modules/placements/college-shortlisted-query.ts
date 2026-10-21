import { z } from "zod";

const Search = z.strictObject({
  q: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  stage: z.enum(["ASSESSMENT","INTERVIEW","OFFERED","HIRED","SHORTLISTED","WAITLISTED","REJECTED","APPLIED","ALL"]).default("ASSESSMENT"),
  status: z.enum(["SUBMITTED","ALL","WITHDRAWN"]).default("SUBMITTED"),
  source: z.enum(["ALL","INTERNAL","EXTERNAL"]).default("ALL"),
  departmentId: z.uuid().optional(),
  programId: z.uuid().optional(),
  batchId: z.uuid().optional(),
});
export function collegeShortlistedQuery(raw: Record<string,string|string[]|undefined>) {
  return Search.safeParse(raw);
}
export function collegeShortlistedHref(jobId: string, query: {q:string;page:number;stage?:string;status?:string;source?:string;
  departmentId?:string;programId?:string;batchId?:string}) {
  const params=new URLSearchParams();
  if(query.q)params.set("q",query.q);
  if(query.page>1)params.set("page",String(query.page));
  if(query.stage&&query.stage!=="ASSESSMENT")params.set("stage",query.stage);
  if(query.status&&query.status!=="SUBMITTED")params.set("status",query.status);
  if(query.source&&query.source!=="ALL")params.set("source",query.source);
  for(const key of ["departmentId","programId","batchId"] as const){
   if(query[key])params.set(key,query[key]!);
  }
  const base="/college/placements/jobs/"+encodeURIComponent(jobId)+"/shortlisted";
  return base+(params.size?"?"+params.toString():"");
}
