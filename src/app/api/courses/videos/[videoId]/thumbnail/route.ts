import { route } from "@/security/route";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import { issueVideoThumbnailUploadGrant } from "@/modules/courses/lesson-video-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { videoId } = params;
    const body = await readJsonBody(request);
    const result = await issueVideoThumbnailUploadGrant(context, videoId, body as never);
    return storageJson(result, 201);
  },
);
