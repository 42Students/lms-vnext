import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createTpoCampaignDraft,TpoCampaignDraftError} from "@/modules/messaging/tpo-campaign-draft-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const body=await request.json().catch(()=>null);
  const result=await createTpoCampaignDraft(await getCurrentRequestContext(),body);
  return NextResponse.json(result,{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_CAMPAIGN"},{status:422});
  if(error instanceof TpoCampaignDraftError)return NextResponse.json({error:error.code},
    {status:error.code==="NOT_READY"?503:409,headers:{"Cache-Control":"no-store"}});
  return apiErrorResponse(error);
 }
}
