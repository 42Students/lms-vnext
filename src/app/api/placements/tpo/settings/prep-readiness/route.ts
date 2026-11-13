import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import {setTpoPrepReadiness,PrepReadinessError} from "@/modules/placements/tpo-prep-readiness-write-service";
import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const result=await setTpoPrepReadiness(__ctx,await readTpoSettingsBody(request));
return privateJson(result);
} catch(error){
  if(error instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_REQUEST"},{
   status:error.code==="BODY_TOO_LARGE"?413:400,
   headers:{"Cache-Control":CACHE.PRIVATE},
  });
  if(error instanceof PrepReadinessError)return NextResponse.json({error:error.code},{status:
   error.code==="PREP_STALE"?409:error.code==="PREP_STORAGE_PENDING"?503:error.code==="PREP_INVALID_COURSE"?422:404});
  return apiErrorResponse(error);
 }
  },
);
