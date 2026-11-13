import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import {saveTpoOutcomeLabels,TpoOutcomeLabelError} from "@/modules/placements/tpo-outcome-label-settings-service";
import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const data=await saveTpoOutcomeLabels(__ctx,await readTpoSettingsBody(request));
return privateJson(data);
} catch(error){
  if(error instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_REQUEST"},{
   status:error.code==="BODY_TOO_LARGE"?413:400,
   headers:{"Cache-Control":CACHE.PRIVATE},
  });
  if(error instanceof TpoOutcomeLabelError)return NextResponse.json({error:error.code},{
   status:error.code==="TPO_SETTINGS_STALE"?409:
     error.code==="TPO_SETTINGS_PENDING"?503:
     error.code==="TPO_SETTINGS_INVALID_LABEL"?400:404,
  });
  return apiErrorResponse(error);
 }
  },
);
