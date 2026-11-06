import { route } from "@/security/route";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import { issueVideoPlaybackGrant } from "@/modules/courses/lesson-video-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { videoId } = params;
    const body = await readJsonBody(request);
    const grant = await issueVideoPlaybackGrant(context, videoId, body as never);
    return storageJson({ grant });
  },
);
