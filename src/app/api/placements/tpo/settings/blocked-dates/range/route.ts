import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {removeBlockedRange,BlockedDateError} from "@/modules/placements/tpo-blocked-date-write-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
return NextResponse.json(await removeBlockedRange(__ctx,await boundedRequestJson(request)),{
   headers:{"Cache-Control":CACHE.PRIVATE}});
} catch(error){
  if(error instanceof BlockedDateError)return NextResponse.json({error:error.code},{
   status:error.code==="DATE_STALE"?409:error.code==="DATE_PENDING"?503:422});
  return apiErrorResponse(error);
 }
  },
);
