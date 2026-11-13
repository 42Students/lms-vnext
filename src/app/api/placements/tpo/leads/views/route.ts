import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoRecruiterSavedViews,changeTpoRecruiterSavedView,TpoSavedViewError}
 from "@/modules/placements/tpo-recruiter-saved-view-service";
import { noStoreJson } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    const result=await listTpoRecruiterSavedViews(__ctx);
    return noStoreJson(result);
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const result=await changeTpoRecruiterSavedView(__ctx,await boundedRequestJson(request));
return noStoreJson(result);
} catch(e){
  if(e instanceof ZodError)return NextResponse.json({error:"INVALID_SAVED_VIEW"},{status:422});
  if(e instanceof TpoSavedViewError)return NextResponse.json({error:e.code},{status:
   e.code==="STORAGE_PENDING"?503:e.code==="VIEW_NOT_FOUND"?404:e.code==="BAD_ACTION"?422:409});
  return apiErrorResponse(e);
 }
  },
);
