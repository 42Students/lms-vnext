import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readAdminPlacementJson} from "@/modules/placements/admin-request-body-model";
import { listPlatformPlacementPolicy, PlatformPlacementPolicyConflict, PlatformPlacementPolicyValidationError, setPlatformPlacementPolicy } from "@/modules/placements/platform-placement-policy-service";
export const runtime="nodejs";
export async function GET(){
 try{return Response.json({fields:await listPlatformPlacementPolicy(await getCurrentRequestContext())},
  {headers:{"Cache-Control":"private, no-store"}});}
 catch(error){return apiErrorResponse(error);}
}
export async function PUT(request:Request){
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const body=await readAdminPlacementJson(request,4096);
  if(!body.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
  const context=await getCurrentRequestContext();
  return Response.json(await setPlatformPlacementPolicy(context,body.value),
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof PlatformPlacementPolicyValidationError)
    return Response.json({error:"INTERVIEW_MIN_EXCEEDS_MAX"},{status:422});
  if(error instanceof PlatformPlacementPolicyConflict)
    return Response.json({error:"POLICY_VERSION_CHANGED"},{status:409});
  return apiErrorResponse(error);
 }
}
