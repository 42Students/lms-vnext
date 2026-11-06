import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { executeCollegeRecurringSchedule, CollegeRecurringExecutionError }
  from "@/modules/academics/college-recurring-execute-service";
import { secured } from "@/security/secure-handler";
export const runtime = "nodejs";
async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    return NextResponse.json(await executeCollegeRecurringSchedule(
      await getCurrentRequestContext(), await request.json(),
    ),{status:201});
  } catch(error) {
    if(error instanceof CollegeRecurringExecutionError) {
      return NextResponse.json({error:error.code},{status:error.code==="NOT_FOUND"?404:409});
    }
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
