import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {getTpoRoundDriveDay} from "@/modules/placements/tpo-round-drive-day-service";
import {placementRoundIdSchema} from "@/modules/placements/validation";

export const runtime="nodejs";
export const dynamic="force-dynamic";

type RouteContext={params:Promise<{roundId:string}>};

/** This scoped health read precedes an RSC refresh. A failed poll must not
 * replace the operator's last known roster with a false empty state.
 */
export async function GET(_request:Request,{params}:RouteContext){
 try{
  const context=await getCurrentRequestContext();
  if(!context.membership||!hasMembershipRole(context,"TPO"))
   throw new AuthorizationError("placements.manage");
  requirePermission(context,"placements.manage",{
   collegeId:context.membership.collegeId,
  });
  const {roundId}=await params;
  // The reader resolves the round's college and rechecks actor permissions;
  // no college selector or participant ID is accepted from the request.
  await getTpoRoundDriveDay(context,placementRoundIdSchema.parse(roundId));
  return new Response(null,{status:204,headers:{
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   Vary:"Cookie",
  }});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
}
