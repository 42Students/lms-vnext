import {redirect} from "next/navigation";

/** The old Interviews destination shows candidate appointments, not a round
 * catalogue. The Super Admin Calendar contains the candidate booking lifecycle,
 * per-interview statuses and an independently recoverable appointment feed. */
export default async function SuperAdminInterviewsPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const raw=await searchParams;
 const query=new URLSearchParams({view:"agenda"});
 for(const key of ["date","company","roundKind","job","jobId"] as const){
  const value=raw[key];
  if(typeof value==="string"&&value.length<=100)query.set(key,value);
 }
 redirect("/admin/placements/calendar?"+query.toString());
}
