import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import {
  removeProjectFile,
  updateProjectFileDetails,
} from "@/modules/projects/project-resource-file-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    fileId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { projectId, fileId } = await params;
    const body = await readJsonBody(request);
    const file = await updateProjectFileDetails(context, projectId, fileId, body as never);
    return storageJson({ file });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { projectId, fileId } = await params;
    const file = await removeProjectFile(context, projectId, fileId);
    return storageJson({ file });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
