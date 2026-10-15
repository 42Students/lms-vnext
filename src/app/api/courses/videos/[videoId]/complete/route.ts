import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { storageJson } from "@/lib/storage-route";
import { completeVideoUpload } from "@/modules/courses/lesson-video-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    videoId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { videoId } = await params;
    const video = await completeVideoUpload(context, videoId);
    return storageJson({ video });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
