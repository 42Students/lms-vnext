import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import { issueVideoPlaybackGrant } from "@/modules/courses/lesson-video-service";

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
    const body = await readJsonBody(request);
    const grant = await issueVideoPlaybackGrant(context, videoId, body as never);
    return storageJson({ grant });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
