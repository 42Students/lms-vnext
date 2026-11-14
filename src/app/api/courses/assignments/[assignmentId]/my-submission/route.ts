import { route } from "@/security/route";
import {
  getMyAssignmentSubmission,
} from "@/modules/courses/assignment-submission-service";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { assignmentId } = params;
    const url = new URL(request.url);
    const submission =
      await getMyAssignmentSubmission(
        context,
        assignmentId,
        url.searchParams.get("deliveryId") ??
          "",
      );
    return privateJson({ submission });
  },
);
