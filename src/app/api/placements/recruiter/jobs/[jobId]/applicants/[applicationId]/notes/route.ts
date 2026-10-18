import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readRecruiterJsonBody, RecruiterJsonBodyError } from "@/modules/placements/recruiter-json-request";
import { addRecruiterApplicantNote } from "@/modules/placements/applicant-notes-service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string; applicationId: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { jobId, applicationId } = await params;
    const result = await addRecruiterApplicantNote(
      await getCurrentRequestContext(),
      jobId,
      applicationId,
      await readRecruiterJsonBody(request,16*1024),
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RecruiterJsonBodyError)
      return NextResponse.json({error:"INVALID_REQUEST"},
       {status:error.kind==="TOO_LARGE"?413:400});
    return apiErrorResponse(error);
  }
}
