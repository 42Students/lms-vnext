import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  getMyAssignmentSubmission,
} from "@/modules/courses/assignment-submission-service";

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
    return NextResponse.json({ submission }, {headers:{"Cache-Control":"private, no-store"}});
  },
);
