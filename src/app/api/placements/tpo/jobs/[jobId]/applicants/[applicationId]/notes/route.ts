import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { addTpoApplicantNote } from "@/modules/placements/applicant-notes-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handlePOST(
  request: Request,
  { params }: { params: Promise<{ jobId: string; applicationId: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { jobId, applicationId } = await params;
    const result = await addTpoApplicantNote(
      await getCurrentRequestContext(),
      jobId,
      applicationId,
      await request.json(),
    );
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
