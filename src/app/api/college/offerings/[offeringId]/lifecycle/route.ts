import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { changeCollegeOfferingLifecycle, CollegeOfferingLifecycleError }
  from "@/modules/courses/college-offering-lifecycle-service";
export const runtime = "nodejs";
type RouteContext = { params: Promise<{ offeringId: string }> };
export async function PATCH(request: Request,{params}:RouteContext) {
  if (!isSameOriginRequest(request)) return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const {offeringId} = await params;
    return NextResponse.json({offering:await changeCollegeOfferingLifecycle(
      await getCurrentRequestContext(),offeringId,await request.json(),
    )});
  } catch (error) {
    if (error instanceof CollegeOfferingLifecycleError)
      return NextResponse.json({error:error.code==="OFFERING_NOT_FOUND"?"NOT_FOUND":error.code},
        {status:error.code==="OFFERING_NOT_FOUND"?404:409});
    return apiErrorResponse(error);
  }
}
