import { route } from "@/security/route";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readAdminPlacementJson} from "@/modules/placements/admin-request-body-model";
import { listPlatformPlacementPolicy, PlatformPlacementPolicyConflict, PlatformPlacementPolicyValidationError, setPlatformPlacementPolicy } from "@/modules/placements/platform-placement-policy-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    return Response.json({fields:await listPlatformPlacementPolicy(__ctx)},
  {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const body=await readAdminPlacementJson(request,4096);
if(!body.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
return Response.json(await setPlatformPlacementPolicy(context,body.value),
    {headers:{"Cache-Control":CACHE.PRIVATE}});
} catch(error){
  if(error instanceof PlatformPlacementPolicyValidationError)
    return Response.json({error:"INTERVIEW_MIN_EXCEEDS_MAX"},{status:422});
  if(error instanceof PlatformPlacementPolicyConflict)
    return Response.json({error:"POLICY_VERSION_CHANGED"},{status:409});
  return apiErrorResponse(error);
 }
  },
);
