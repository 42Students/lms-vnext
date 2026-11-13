import { route } from "@/security/route";
import {
  getLearnerCourseWorkspace,
} from "@/modules/courses/learner-course-service";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url = new URL(request.url);
    const workspace =
      await getLearnerCourseWorkspace(
        context,
        url.searchParams.get("deliveryId") ??
          "",
      );
    return privateJson({ workspace });
  },
);
