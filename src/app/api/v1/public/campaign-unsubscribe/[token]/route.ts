import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {unsubscribeTpoCampaignRecipient} from "@/modules/messaging/tpo-campaign-unsubscribe-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Ctx={params:Promise<{token:string}>};
/** Old outbound campaign links may POST here. This compatibility path never
 * performs an opt-out via GET and never embeds the token in a response. */
export async function POST(request:Request,{params}:Ctx){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:{"Cache-Control":"no-store"}});
 const {token}=await params;
 if(token.length>0&&token.length<=2048)
  await unsubscribeTpoCampaignRecipient(token);
 return NextResponse.json({status:"UNSUBSCRIBED"},{
  headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"},
 });
}
