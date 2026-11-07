import { route } from "@/security/route";
import { storageJson } from "@/lib/storage-route";
import { listLessonVideosForViewer } from "@/modules/courses/lesson-video-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { lessonId } = params;
    const deliveryId = new URL(request.url).searchParams.get("deliveryId") ?? "";
    const videos = await listLessonVideosForViewer(context, lessonId, deliveryId);
    return storageJson({ videos });
  },
);
