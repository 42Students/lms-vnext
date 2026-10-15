import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { storageJson } from "@/lib/storage-route";
import { completeSubmissionFileUpload } from "@/modules/courses/assignment-submission-file-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    assignmentId: string;
    fileId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { assignmentId, fileId } = await params;
    const file = await completeSubmissionFileUpload(context, assignmentId, fileId);
    return storageJson({ file });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
