import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readOptionalJsonBody, storageJson } from "@/lib/storage-route";
import { issueSubmissionFileDownloadGrant } from "@/modules/courses/assignment-submission-file-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    fileId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { fileId } = await params;
    const body = (await readOptionalJsonBody(request)) as { disposition?: "inline" | "attachment" };
    const grant = await issueSubmissionFileDownloadGrant(context, fileId, { ...(body.disposition !== undefined ? { disposition: body.disposition } : {}) });
    return storageJson({ grant });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
