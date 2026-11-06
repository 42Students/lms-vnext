import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  markCollegeBatchGraduated, CollegeBatchGraduationError,
} from "@/modules/academics/college-batch-graduation-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";
type Params = { params: Promise<{ cohortId: string }> };
async function handlePOST(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const { cohortId } = await params;
    const result = await markCollegeBatchGraduated(context, cohortId, await request.json());
    return NextResponse.json({ cohort: result });
  } catch (error) {
    if (error instanceof CollegeBatchGraduationError)
      return NextResponse.json({ error: error.code },
        { status: error.code === "BATCH_NOT_FOUND" ? 404 : 409 });
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
