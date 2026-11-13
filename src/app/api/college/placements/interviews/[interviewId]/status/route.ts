import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {finishCollegeInterview,CollegeInterviewLifecycleError}
 from "@/modules/placements/college-interview-lifecycle-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {interviewId}=params;
const raw=await boundedRequestJson(request) as Record<string,unknown>;
const result=await finishCollegeInterview(__ctx,{
   id:interviewId,status:raw["status"],expectedVersion:raw["expectedVersion"],
   reason:raw["reason"],
  });
return privateJson(result);
} catch(error){
  if(error instanceof CollegeInterviewLifecycleError)
   return NextResponse.json({error:error.code},{status:error.code==="INTERVIEW_STORAGE_PENDING"?503:409});
  return apiErrorResponse(error);
 }
  },
);
