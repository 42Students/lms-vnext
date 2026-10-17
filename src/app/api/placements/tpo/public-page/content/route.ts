import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {saveTpoPublicPlacementContent} from "@/modules/placements/public-page/content-service";
export const runtime="nodejs";
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const input:unknown=await request.json();
  const content=await saveTpoPublicPlacementContent(await getCurrentRequestContext(),input);
  return NextResponse.json({content});
 }catch(error){return apiErrorResponse(error);}
}
