import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {getTpoRoundDriveDay} from "@/modules/placements/tpo-round-drive-day-service";
import {placementRoundIdSchema} from "@/modules/placements/validation";

import { ROLE } from "@/modules/identity/roles";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";

type RouteContext={params:Promise<{roundId:string}>};

/** This scoped health read precedes an RSC refresh. A failed poll must not
 * replace the operator's last known roster with a false empty state.
 */
export const GET = route(
  { auth: "user", permission: "placements.manage" },
  async ({ context: __actor, params }) => {
    const context = __actor!;
    try {
if(!context.membership||!hasMembershipRole(context,ROLE.TPO))
   throw new AuthorizationError("placements.manage");
requirePermission(context,"placements.manage",{
   collegeId:context.membership.collegeId,
  });
const {roundId}=params;
await getTpoRoundDriveDay(context,placementRoundIdSchema.parse(roundId));
return new Response(null,{status:204,headers:{
   "Cache-Control":CACHE.PRIVATE_STRICT,
   "X-Content-Type-Options":"nosniff",
   Vary:"Cookie",
  }});
} catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
  },
);
