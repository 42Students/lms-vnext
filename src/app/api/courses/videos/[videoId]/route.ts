import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import {
  removeLessonVideo,
  updateLessonVideo,
} from "@/modules/courses/lesson-video-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    videoId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { videoId } = await params;
    const body = await readJsonBody(request);
    const video = await updateLessonVideo(context, videoId, body as never);
    return storageJson({ video });
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
    const { videoId } = await params;
    const result = await removeLessonVideo(context, videoId);
    return storageJson(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
