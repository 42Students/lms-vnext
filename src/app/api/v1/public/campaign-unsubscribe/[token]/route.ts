import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {CampaignUnsubscribeInvalid,unsubscribeTpoCampaignRecipient} from "@/modules/messaging/tpo-campaign-unsubscribe-service";
import { route } from "@/security/route";
import { CACHE, noStoreJson } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Ctx={params:Promise<{token:string}>};
/** Old outbound campaign links may POST here. This compatibility path never
 * performs an opt-out via GET and never embeds the token in a response. */
async function handlePOST(request:Request,{params}:Ctx){
 if(!isSameOriginRequest(request))
  return noStoreJson({error:"INVALID_ORIGIN"}, { status: 403 });
 const {token}=await params;
 if(token.length>0&&token.length<=2048){
  try { await unsubscribeTpoCampaignRecipient(token); }
  catch(error){
   // Legacy public links are idempotent: a revoked recipient is
   // indistinguishable from an already completed opt-out.
   // Storage/provider failures still propagate: never claim a write then.
   if(error instanceof Error&&error.message==="TPO_CAMPAIGNS_NOT_REGISTERED")
    return NextResponse.json({error:"SUPPRESSIONS_NOT_READY",message:"That didn't work. Please try again."},{
     status:503,headers:{"Cache-Control":CACHE.NONE},
    });
   if(!(error instanceof CampaignUnsubscribeInvalid))throw error;
  }
 }
 return NextResponse.json({status:"UNSUBSCRIBED"},{
  headers:{"Cache-Control":CACHE.NONE,"Referrer-Policy":"no-referrer"},
 });
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
