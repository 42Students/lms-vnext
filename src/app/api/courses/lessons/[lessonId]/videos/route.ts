import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import {
  issueVideoUploadGrant,
  listLessonVideosForManagement,
} from "@/modules/courses/lesson-video-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    lessonId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const { lessonId } = await params;
    const deliveryId = new URL(request.url).searchParams.get("deliveryId");
    const videos = await listLessonVideosForManagement(context, lessonId, deliveryId);
    return storageJson({ videos });
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
    const { lessonId } = await params;
    const body = await readJsonBody(request);
    const result = await issueVideoUploadGrant(context, lessonId, body as never);
    return storageJson(result, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
