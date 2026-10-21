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
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  const jobs=await listOwnPlacementSavedJobs(context);
  return NextResponse.json({jobs,status:"success",message:"Saved jobs retrieved",data:jobs});
 }catch(error){
  if(savedJobsTableUnavailable(error)){
   return NextResponse.json({error:"SAVED_JOBS_NOT_CONFIGURED",status:"error",message:"Saved jobs not configured"},{status:503,headers:{"Retry-After":"60"}});
  }
  return apiErrorResponse(error);
 }
}
