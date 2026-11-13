import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoCampaignBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import {createTpoCampaignDraft,TpoCampaignDraftError} from "@/modules/messaging/tpo-campaign-draft-service";
import { CACHE, noStoreJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const body=await readTpoCampaignBody(request);
const result=await createTpoCampaignDraft(__ctx,body);
return noStoreJson(result, { status: 201 });
} catch(error){
  if(error instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_CAMPAIGN"},{
   status:error.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":CACHE.PRIVATE},
  });
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_CAMPAIGN"},{status:422});
  if(error instanceof TpoCampaignDraftError)return NextResponse.json({error:error.code},
    {status:error.code==="NOT_READY"?503:409,headers:{"Cache-Control":CACHE.NONE}});
  return apiErrorResponse(error);
 }
  },
);
