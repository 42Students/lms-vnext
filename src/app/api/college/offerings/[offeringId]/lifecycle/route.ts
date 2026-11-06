import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { changeCollegeOfferingLifecycle, CollegeOfferingLifecycleError }
  from "@/modules/courses/college-offering-lifecycle-service";
export const runtime = "nodejs";
type RouteContext = { params: Promise<{ offeringId: string }> };
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {offeringId} = params;
return NextResponse.json({offering:await changeCollegeOfferingLifecycle(
      __ctx,offeringId,await request.json(),
    )});
} catch (error) {
    if (error instanceof CollegeOfferingLifecycleError)
      return NextResponse.json({error:error.code==="OFFERING_NOT_FOUND"?"NOT_FOUND":error.code},
        {status:error.code==="OFFERING_NOT_FOUND"?404:409});
    return apiErrorResponse(error);
  }
  },
);
