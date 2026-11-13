import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  gradeAssignmentSubmission,
} from "@/modules/courses/assignment-submission-service";
import { gradeAssignmentSubmissionInputSchema } from "@/modules/courses/assignment-validation";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { submissionId } = params;
    const body = gradeAssignmentSubmissionInputSchema.parse(await boundedRequestJson(request));
    const submission =
      await gradeAssignmentSubmission(
        context,
        submissionId,
        body,
      );
    return NextResponse.json({ submission }, {
      headers: { "Cache-Control": CACHE.NONE },
    });
  },
);
