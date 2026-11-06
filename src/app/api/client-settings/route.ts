import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {
 legacyClientSettingsEnvelope,
 readLearnerPlaybackSettings,
} from "@/modules/courses/learner-playback-settings";

export const runtime="nodejs";

/** Legacy authenticated client-settings endpoint. Settings are global safe
 * playback/poll intervals, never an unauthenticated or tenant-sensitive dump.
 * The service retains its resilient defaults during a configuration outage. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor }) => {
    const context = actor!;
    const settings=await readLearnerPlaybackSettings(context.membership?.collegeId);
    return NextResponse.json(legacyClientSettingsEnvelope(settings),{
   headers:{"Cache-Control":"private, no-store"},
  });
  },
);
