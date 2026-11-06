import { route } from "@/security/route";
import { storageJson } from "@/lib/storage-route";
import { completeVideoUpload } from "@/modules/courses/lesson-video-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "courses.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { videoId } = params;
    const video = await completeVideoUpload(context, videoId);
    return storageJson({ video });
  },
);
