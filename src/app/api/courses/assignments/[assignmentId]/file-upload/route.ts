import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createAssignmentFileUploadGrant,
} from "@/modules/courses/assignment-file-service";
import {
  assignmentFilesRuntimeEnabled,
} from "@/modules/courses/assignment-file-readiness";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    assignmentId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }
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
    const { assignmentId } = await params;
    const grant =
      await createAssignmentFileUploadGrant(
        context,
        assignmentId,
        await request.json(),
      );
    return NextResponse.json(
      { grant },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
