import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listOwnPlacementSavedJobs} from "@/modules/placements/saved-job-service";
export const runtime="nodejs";
/** Missing DB08 migration: keep a recoverable 503 instead of an opaque 500. */
function savedJobsTableUnavailable(error: unknown): boolean {
 let current: unknown = error;
 for (let depth = 0; depth < 3; depth++) {
  if (current === null || typeof current !== "object") return false;
  const cause = current as { code?: unknown; cause?: unknown };
  if (cause.code === "42P01") return true;
  current = cause.cause;
 }
 return false;
}
/** LEARNER-placements-13: this is the caller's bookmarks only. */
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  const idsOnly=url.searchParams.get("ids")==="1";
  if([...url.searchParams.keys()].some(key=>key!=="ids")||
    (url.searchParams.has("ids")&&!idsOnly))
    return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  const context=await getCurrentRequestContext();
  const jobs=await listOwnPlacementSavedJobs(context);
  // Historical bookmark badges require only visible job UUIDs. Never return
  // all saved foreign learner IDs or archived tenant-independent metadata.
  if(idsOnly)return NextResponse.json({ids:jobs.map(job=>job.jobId),
    data:jobs.map(job=>job.jobId),status:"success",
    message:jobs.length?"Saved jobs retrieved":"No saved jobs"},{
    headers:{"Cache-Control":"private, no-store"},
  });
  return NextResponse.json({jobs,status:"success",
   message:jobs.length?"Saved jobs retrieved":"No saved jobs",data:jobs},{
   headers:{"Cache-Control":"private, no-store"},
  });
 }catch(error){
  if(savedJobsTableUnavailable(error)){
   return NextResponse.json({error:"SAVED_JOBS_NOT_CONFIGURED",status:"error",message:"Saved jobs not configured"},{status:503,headers:{"Retry-After":"60"}});
  }
  return apiErrorResponse(error);
 }
}
