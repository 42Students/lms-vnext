import { route } from "@/security/route";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import {
  removeLessonVideo,
  updateLessonVideo,
} from "@/modules/courses/lesson-video-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { videoId } = params;
    const body = await readJsonBody(request);
    const video = await updateLessonVideo(context, videoId, body as never);
    return storageJson({ video });
  },
);

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { videoId } = params;
    const result = await removeLessonVideo(context, videoId);
    return storageJson(result);
  },
);
