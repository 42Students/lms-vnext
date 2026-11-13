import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import {previewSelectedTpoCampaignAudience} from "@/modules/messaging/engage-audience-service";

import { CACHE, noStoreJson } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Read-only calculation: never issues or queues campaign mail. */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const input=await readTpoSettingsBody(request);
const result=await previewSelectedTpoCampaignAudience(__ctx,input);
return noStoreJson(result);
} catch(error){
  if(error instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_SELECTION"},{
   status:error.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":CACHE.PRIVATE},
  });
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_SELECTION"},{status:422});
  return apiErrorResponse(error);
 }
  },
);
