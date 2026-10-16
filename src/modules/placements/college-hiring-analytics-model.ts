import { z } from "zod";
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
