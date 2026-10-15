import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { storageJson } from "@/lib/storage-route";
import { completeProjectFileUpload } from "@/modules/projects/project-resource-file-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    fileId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { projectId, fileId } = await params;
    const file = await completeProjectFileUpload(context, projectId, fileId);
    return storageJson({ file });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
