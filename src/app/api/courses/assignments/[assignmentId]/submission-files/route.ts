import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import {
  issueSubmissionFileUploadGrant,
  listMySubmissionFiles,
} from "@/modules/courses/assignment-submission-file-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    assignmentId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const { assignmentId } = await params;
    const deliveryId = new URL(request.url).searchParams.get("deliveryId") ?? "";
    const files = await listMySubmissionFiles(context, assignmentId, deliveryId);
    return storageJson({ files });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { assignmentId } = await params;
    const body = await readJsonBody(request);
    const result = await issueSubmissionFileUploadGrant(context, assignmentId, body as never);
    return storageJson(result, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
