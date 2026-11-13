import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  markCollegeBatchGraduated, CollegeBatchGraduationError,
} from "@/modules/academics/college-batch-graduation-service";

export const runtime = "nodejs";
type Params = { params: Promise<{ cohortId: string }> };
export const POST = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { cohortId } = params;
const result = await markCollegeBatchGraduated(context, cohortId, await boundedRequestJson(request));
return NextResponse.json({ cohort: result });
} catch (error) {
    if (error instanceof CollegeBatchGraduationError)
      return NextResponse.json({ error: error.code },
        { status: error.code === "BATCH_NOT_FOUND" ? 404 : 409 });
    return apiErrorResponse(error);
  }
  },
);
