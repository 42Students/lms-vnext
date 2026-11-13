import { route } from "@/security/route";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getMentorMeetingChangeHistory } from "@/modules/projects/mentor-meeting-history-service";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";
type Route = { params: Promise<{ projectId: string }> };

/** Typed, paginated meeting history for the currently assigned mentor only. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const { projectId } = params;
    const url = new URL(request.url);
    const data = await getMentorMeetingChangeHistory(__ctx, {
      projectId,
      ...(url.searchParams.has("meetingKey") ? { meetingKey: url.searchParams.get("meetingKey") } : {}),
      page: url.searchParams.get("page") ?? "1",
    });
    return privateJson(data);
  },
);
