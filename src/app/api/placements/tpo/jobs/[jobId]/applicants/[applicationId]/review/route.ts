import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { reviewTpoApplicant } from "@/modules/placements/tpo-applicant-review-service";
export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId, applicationId} = params;
    const saved = await reviewTpoApplicant(__ctx,
      {jobId, applicationId}, await request.json());
    return NextResponse.json({ status: saved.status, updatedAt: saved.updatedAt.toISOString() });
  },
);
