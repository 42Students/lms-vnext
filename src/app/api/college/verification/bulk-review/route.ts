import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {reviewCollegeVerificationBulk} from "@/modules/verification/staff-bulk-review-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "profile-verification.review" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const result=await reviewCollegeVerificationBulk(context,await boundedRequestJson(request, 8 * 1024 * 1024));
return privateJson(result);
} catch(error){
  if(error instanceof VerificationUnavailableError)
   return NextResponse.json({error:"VERIFICATION_UNAVAILABLE"},{status:503});
  return apiErrorResponse(error);
 }
  },
);
