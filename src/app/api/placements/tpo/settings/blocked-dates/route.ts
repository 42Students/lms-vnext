import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createBlockedDate,BlockedDateError} from "@/modules/placements/tpo-blocked-date-write-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const result=await createBlockedDate(__ctx,await boundedRequestJson(request));
return privateJson(result, { status: 201 });
} catch(error){
  if(error instanceof BlockedDateError)return NextResponse.json({error:error.code},{
   status:error.code==="DATE_EXISTS"?409:error.code==="DATE_PENDING"?503:error.code==="DATE_IN_PAST"||error.code==="DATE_RANGE_INVALID"?422:404});
  return apiErrorResponse(error);
 }
  },
);
