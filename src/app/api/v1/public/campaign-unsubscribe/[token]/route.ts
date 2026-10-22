import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {CampaignUnsubscribeInvalid,unsubscribeTpoCampaignRecipient} from "@/modules/messaging/tpo-campaign-unsubscribe-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Ctx={params:Promise<{token:string}>};
/** Old outbound campaign links may POST here. This compatibility path never
 * performs an opt-out via GET and never embeds the token in a response. */
export async function POST(request:Request,{params}:Ctx){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:{"Cache-Control":"no-store"}});
 const {token}=await params;
 if(token.length>0&&token.length<=2048){
  try { await unsubscribeTpoCampaignRecipient(token); }
  catch(error){
   // Legacy public links are idempotent: a revoked recipient is
   // indistinguishable from an already completed opt-out.
   // Storage/provider failures still propagate: never claim a write then.
   if(error instanceof Error&&error.message==="TPO_CAMPAIGNS_NOT_REGISTERED")
    return NextResponse.json({error:"SUPPRESSIONS_NOT_READY",message:"That didn't work. Please try again."},{
     status:503,headers:{"Cache-Control":"no-store"},
    });
   if(!(error instanceof CampaignUnsubscribeInvalid))throw error;
  }
 }
 return NextResponse.json({status:"UNSUBSCRIBED"},{
  headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"},
 });
}
