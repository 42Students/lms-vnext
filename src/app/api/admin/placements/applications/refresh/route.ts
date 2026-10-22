import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

export const runtime="nodejs";

/** Legacy POST /job-applications/refresh repopulated a startup Spring cache.
 * vNext reads authorized, indexed SQL directly on each request. There is NO
 * process-local application cache to rebuild, no per-tenant stale snapshot,
 * and no cross-college read grant provided by calling this compatibility URL.
 * External maintenance callers can retire their refresh loop safely.
 */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE")
   throw new AuthorizationError("placements.read");
  requirePermission(context,"placements.read",{
   ...(context.adminScope?.collegeId != null ? {collegeId:context.adminScope.collegeId} : {}),
   ...(context.adminScope?.organizationId != null ? {organizationId:context.adminScope.organizationId} : {}),
  });
  return NextResponse.json({
   message:"Applications are read live; no cache refresh is required",
   cache:"LIVE_DATABASE",
   refreshed:false,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
