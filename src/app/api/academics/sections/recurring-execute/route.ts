import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { executeCollegeRecurringSchedule, CollegeRecurringExecutionError }
  from "@/modules/academics/college-recurring-execute-service";
export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
return NextResponse.json(await executeCollegeRecurringSchedule(
      __ctx, await boundedRequestJson(request),
    ),{status:201});
} catch(error) {
    if(error instanceof CollegeRecurringExecutionError) {
      return NextResponse.json({error:error.code},{status:error.code==="NOT_FOUND"?404:409});
    }
    return apiErrorResponse(error);
  }
  },
);
