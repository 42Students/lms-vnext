import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  gradeAssignmentSubmission,
} from "@/modules/courses/assignment-submission-service";
import { gradeAssignmentSubmissionInputSchema } from "@/modules/courses/assignment-validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
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
    const context =
      await getCurrentRequestContext();
    const { submissionId } = await params;
    // Grade, feedback and the optimistic version are submitted together.
    // The old query-string-only updatePoints request is not replay-safe.
    const body = gradeAssignmentSubmissionInputSchema.parse(await request.json());
    const submission =
      await gradeAssignmentSubmission(
        context,
        submissionId,
        body,
      );

    // Clients update their grade row from this result and refresh their
    // submissions list; never cache a grade mutation response.
    return NextResponse.json({ submission }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
