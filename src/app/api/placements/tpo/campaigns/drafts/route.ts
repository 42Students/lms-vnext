import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoCampaignBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import {createTpoCampaignDraft,TpoCampaignDraftError} from "@/modules/messaging/tpo-campaign-draft-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const body=await readTpoCampaignBody(request);
  const result=await createTpoCampaignDraft(await getCurrentRequestContext(),body);
  return NextResponse.json(result,{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_CAMPAIGN"},{
   status:error.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":"private, no-store"},
  });
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_CAMPAIGN"},{status:422});
  if(error instanceof TpoCampaignDraftError)return NextResponse.json({error:error.code},
    {status:error.code==="NOT_READY"?503:409,headers:{"Cache-Control":"no-store"}});
  return apiErrorResponse(error);
 }
}
