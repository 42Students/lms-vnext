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
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { cohortId } = params;
    const result = await markCollegeBatchGraduated(context, cohortId, await request.json());
    return NextResponse.json({ cohort: result });
  },
);
