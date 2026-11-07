import { route } from "@/security/route";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import {
  issueVideoUploadGrant,
  listLessonVideosForManagement,
} from "@/modules/courses/lesson-video-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { lessonId } = params;
    const deliveryId = new URL(request.url).searchParams.get("deliveryId");
    const videos = await listLessonVideosForManagement(context, lessonId, deliveryId);
    return storageJson({ videos });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { lessonId } = params;
    const body = await readJsonBody(request);
    const result = await issueVideoUploadGrant(context, lessonId, body as never);
    return storageJson(result, 201);
  },
);
