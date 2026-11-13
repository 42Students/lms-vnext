import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {
  readLegacyProjectMeetingSection, synchronizeLegacyProjectMeetingSection,
} from "@/modules/projects/legacy-meeting-section-sync-service";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {projectId} = params;
    const snapshot = await readLegacyProjectMeetingSection(context, projectId);
    return privateJson(snapshot);
  },
);

export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId} = params;
    const body: unknown = await boundedRequestJson(request);
    const result = await synchronizeLegacyProjectMeetingSection(context, projectId, body);
    return privateJson(result);
  },
);
