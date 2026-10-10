import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createAssignmentFileReadGrant,
} from "@/modules/courses/assignment-file-service";
import {
  assignmentFilesRuntimeEnabled,
} from "@/modules/courses/assignment-file-readiness";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    submissionId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  if (!assignmentFilesRuntimeEnabled()) {
    return NextResponse.json(
      {
        error:
          "DB06_ASSIGNMENT_FILES_MIGRATIONS_PENDING",
      },
      { status: 503 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const { submissionId } =
      await params;
    const grant =
      await createAssignmentFileReadGrant(
        context,
        submissionId,
      );
    return NextResponse.redirect(
      grant.readUrl,
      307,
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
