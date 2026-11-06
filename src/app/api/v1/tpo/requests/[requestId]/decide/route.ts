import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {decideLegacyTpoRequest} from "@/modules/placements/tpo-global-requests-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{requestId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {requestId}=await params;
  const _body=await readBoundedJsonRequest(request,8192);
  if(!_body.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const decided=await decideLegacyTpoRequest(
   await getCurrentRequestContext(),requestId,_body.value);
  // Legacy returns the decided request itself, not {request:...}.
  return NextResponse.json(decided,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
