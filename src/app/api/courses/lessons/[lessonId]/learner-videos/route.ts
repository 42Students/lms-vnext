import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { storageJson } from "@/lib/storage-route";
import { listLessonVideosForViewer } from "@/modules/courses/lesson-video-service";

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
    const deliveryId = new URL(request.url).searchParams.get("deliveryId") ?? "";
    const videos = await listLessonVideosForViewer(context, lessonId, deliveryId);
    return storageJson({ videos });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
