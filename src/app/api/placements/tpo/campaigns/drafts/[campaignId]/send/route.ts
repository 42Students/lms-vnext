import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {dispatchTpoCampaign,TpoCampaignDispatchError} from "@/modules/messaging/tpo-campaign-dispatch-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request,{params}:{params:Promise<{campaignId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await dispatchTpoCampaign(await getCurrentRequestContext(),(await params).campaignId);
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  if(e instanceof ZodError)return NextResponse.json({error:"INVALID_CAMPAIGN"},{status:422});
  if(e instanceof TpoCampaignDispatchError)return NextResponse.json({error:e.code},{
   status:e.code==="NOT_READY"?503:e.code==="NOT_FOUND"?404:409,
   headers:{"Cache-Control":"no-store"},
  });
  return apiErrorResponse(e);
 }
}
