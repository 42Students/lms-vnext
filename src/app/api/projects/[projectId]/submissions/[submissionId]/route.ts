import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  updateProjectSubmissionDraft,
} from "@/modules/projects/submission-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    submissionId: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { projectId, submissionId } =
      await params;
    const body = await request.json();
    const submission =
      await updateProjectSubmissionDraft(
        context,
        projectId,
        submissionId,
        body,
      );

    return NextResponse.json({ submission });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
