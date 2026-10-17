import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listOwnPlacementSavedJobs} from "@/modules/placements/saved-job-service";
export const runtime="nodejs";
/** LEARNER-placements-13: this is the caller's bookmarks only. */
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  const jobs=await listOwnPlacementSavedJobs(context);
  return NextResponse.json({jobs});
 }catch(error){return apiErrorResponse(error);}
}
