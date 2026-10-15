import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import {
  issueProjectFileUploadGrant,
  listProjectFiles,
} from "@/modules/projects/project-resource-file-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    const files = await listProjectFiles(context, projectId);
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
    const { projectId } = await params;
    const body = await readJsonBody(request);
    const result = await issueProjectFileUploadGrant(context, projectId, body as never);
    return storageJson(result, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
