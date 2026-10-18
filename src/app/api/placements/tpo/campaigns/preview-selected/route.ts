import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import {previewSelectedTpoCampaignAudience} from "@/modules/messaging/engage-audience-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Read-only calculation: never issues or queues campaign mail. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request)){
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 }
 try{
  const input=await readTpoSettingsBody(request);
  const result=await previewSelectedTpoCampaignAudience(await getCurrentRequestContext(),input);
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_SELECTION"},{
   status:error.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":"private, no-store"},
  });
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_SELECTION"},{status:422});
  return apiErrorResponse(error);
 }
}
