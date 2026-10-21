import { redirect } from "next/navigation";
/** Legacy Hiring Dashboard address. The scoped report with KPI, funnel and
 * company sections is the Analytics page; do not treat job-count list as the
 * original dashboard or synthesize three incompatible legacy API responses. */
export default async function SuperAdminHiringPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const raw=await searchParams;
 const params=new URLSearchParams();
 for(const key of ["q","jobId","departmentId","programId","cohortId","appliedFrom","appliedTo"] as const){
  const value=raw[key];
  if(typeof value==="string"&&value.length<=100)params.set(key,value);
 }
 const suffix=params.toString();
 redirect("/admin/placements/analytics"+(suffix?"?"+suffix:""));
}
