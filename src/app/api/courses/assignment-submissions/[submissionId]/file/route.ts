import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  issueSubmissionFileDownloadGrant,
  listSubmissionFiles,
} from "@/modules/courses/assignment-submission-file-service";
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
    // The legacy link redirects to the first file in the registered ordered
    // submission. Modern clients request each file's individual signed URL.
    const [firstFile] = await listSubmissionFiles(context, submissionId);
    if (!firstFile) {
      return NextResponse.json(
        { error: "ASSIGNMENT_SUBMISSION_NOT_FOUND" },
        { status: 404 },
      );
    }
    const grant = await issueSubmissionFileDownloadGrant(
      context,
      firstFile.id,
    );
    return NextResponse.redirect(grant.url, 307);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
