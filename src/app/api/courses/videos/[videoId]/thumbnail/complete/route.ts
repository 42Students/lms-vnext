import { route } from "@/security/route";
import { storageJson } from "@/lib/storage-route";
import { completeVideoThumbnailUpload } from "@/modules/courses/lesson-video-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { videoId } = params;
    const video = await completeVideoThumbnailUpload(context, videoId);
    return storageJson({ video });
  },
);
