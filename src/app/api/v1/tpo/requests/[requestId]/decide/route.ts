import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {decideLegacyTpoRequest} from "@/modules/placements/tpo-global-requests-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{requestId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {requestId}=await params;
  const decided=await decideLegacyTpoRequest(
   await getCurrentRequestContext(),requestId,await request.json());
  // Legacy returns the decided request itself, not {request:...}.
  return NextResponse.json(decided,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
