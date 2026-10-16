import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { listPlatformPlacementPolicy, PlatformPlacementPolicyConflict, setPlatformPlacementPolicy } from "@/modules/placements/platform-placement-policy-service";
export const runtime="nodejs";
export async function GET(){
 try{return Response.json({fields:await listPlatformPlacementPolicy(await getCurrentRequestContext())},
  {headers:{"Cache-Control":"private, no-store"}});}
 catch(error){return apiErrorResponse(error);}
}
export async function PUT(request:Request){
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const body:unknown=await request.json();
  return Response.json(await setPlatformPlacementPolicy(context,body),
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof PlatformPlacementPolicyConflict)
    return Response.json({error:"POLICY_VERSION_CHANGED"},{status:409});
  return apiErrorResponse(error);
 }
}
