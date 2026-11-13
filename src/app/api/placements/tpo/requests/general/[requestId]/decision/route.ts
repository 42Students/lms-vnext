import { boundedRequestJson } from "@/lib/bounded-request-json";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {TpoGeneralRequestError,decideTpoGeneralRequest} from "@/modules/placements/tpo-general-request-service";
import { route } from "@/security/route";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{requestId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {requestId}=await params;
  return NextResponse.json(await decideTpoGeneralRequest(await getCurrentRequestContext(),requestId,await boundedRequestJson(request)),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
 }catch(error){
  if(error instanceof TpoGeneralRequestError)return NextResponse.json({error:error.code},
   {status:error.code==="UNAVAILABLE"?503:error.code==="STALE"||error.code==="TARGET_CHANGED"?409:
    error.code==="EFFECT_UNSUPPORTED"?422:403});
  return apiErrorResponse(error);
 }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
