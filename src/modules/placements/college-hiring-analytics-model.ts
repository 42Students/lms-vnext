import { z } from "zod";

/** Intentional vNext report-policy difference from legacy:
 * class-level filters were removed, because hiring application facts are
 * currently attached to learner program/cohort enrollment, not to a historic
 * per-class membership at application time. Applying a classId as though it
 * were a cohortId would produce misleading hiring totals. A legacy classId
 * query is rejected by the strict schema rather than silently ignored.
 */
export const COLLEGE_HIRING_CLASS_FILTER_POLICY = {
 supported:false,
 reason:"Class-level hiring reports are not available. Filter by department, program or cohort instead.",
} as const;
export const collegeHiringAnalyticsSchema = z.strictObject({
  seasonId: z.uuid().optional(),
  jobId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  programId: z.uuid().optional(),
  cohortId: z.uuid().optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
}).superRefine((v,ctx)=>{
  if (v.from && v.to && v.from > v.to)
    ctx.addIssue({code:"custom",path:["to"],message:"End date must be on or after start date"});
});
export function collegeHiringAnalyticsQuery(raw: Record<string,string|string[]|undefined>) {
  const input:Record<string,string>={};
  // Any other query parameter (for example a caller-supplied collegeId) is refused.
  const known:readonly string[]=["seasonId","jobId","departmentId","programId","cohortId","from","to"];
  for (const [key,value] of Object.entries(raw)){
    if(!known.includes(key)&&value!==undefined)return collegeHiringAnalyticsSchema.safeParse({[key]:value});
  }
  for (const key of ["seasonId","jobId","departmentId","programId","cohortId","from","to"] as const){
    const value=raw[key];
    if (Array.isArray(value))return collegeHiringAnalyticsSchema.safeParse({...input,[key]:value});
    if(typeof value==="string"&&value)input[key]=value;
  }
  return collegeHiringAnalyticsSchema.safeParse(input);
}
export function collegeHiringAnalyticsHref(input:Record<string,string|undefined>){
  const params=new URLSearchParams();
  for(const key of ["seasonId","jobId","departmentId","programId","cohortId","from","to"] as const){
    if(input[key])params.set(key,input[key]!);
  }
  return "/college/hiring-dashboard"+(params.size?"?"+params.toString():"");
}
