import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {TpoGeneralRequestError,decideTpoGeneralRequest} from "@/modules/placements/tpo-general-request-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{requestId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {requestId}=await params;
  return NextResponse.json(await decideTpoGeneralRequest(await getCurrentRequestContext(),requestId,await request.json()),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoGeneralRequestError)return NextResponse.json({error:error.code},
   {status:error.code==="UNAVAILABLE"?503:error.code==="STALE"||error.code==="TARGET_CHANGED"?409:
    error.code==="EFFECT_UNSUPPORTED"?422:403});
  return apiErrorResponse(error);
 }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
