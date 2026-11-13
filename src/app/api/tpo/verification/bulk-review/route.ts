import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {reviewTpoVerificationBulk} from "@/modules/verification/tpo-bulk-review-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const parsed=await readBoundedJsonRequest(request,16384);
if(!parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
const result=await reviewTpoVerificationBulk(context,parsed.value);
return privateJson(result);
} catch(error){
  if(error instanceof VerificationUnavailableError)
   return NextResponse.json({error:"VERIFICATION_UNAVAILABLE"},{status:503});
  return apiErrorResponse(error);
 }
  },
);
