import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import {setTpoPublicJoinLinkEnabled,TpoPublicJoinLinkError} from "@/modules/placements/tpo-public-join-link-service";
import { CACHE, noStoreJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const value=await setTpoPublicJoinLinkEnabled(__ctx,
    await readTpoSettingsBody(request));
return noStoreJson(value);
} catch(e){
  if(e instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_BODY"},{
   status:e.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":CACHE.PRIVATE},
  });
  if(e instanceof ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  if(e instanceof TpoPublicJoinLinkError)return NextResponse.json({error:e.code},{
   status:e.code==="NOT_REGISTERED"?503:e.code==="STALE"?409:404});
  return apiErrorResponse(e);
 }
  },
);
