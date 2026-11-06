import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { reviewTpoApplicant } from "@/modules/placements/tpo-applicant-review-service";
import { secured } from "@/security/secure-handler";
export const runtime = "nodejs";
async function handlePOST(request: Request, {params}: {
  params: Promise<{ jobId: string; applicationId: string }>;
}) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const {jobId, applicationId} = await params;
    const saved = await reviewTpoApplicant(await getCurrentRequestContext(),
      {jobId, applicationId}, await request.json());
    return NextResponse.json({ status: saved.status, updatedAt: saved.updatedAt.toISOString() });
  } catch (error) { return apiErrorResponse(error); }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
