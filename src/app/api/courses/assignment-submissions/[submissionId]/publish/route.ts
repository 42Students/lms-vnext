import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  publishAssignmentGrade,
} from "@/modules/courses/assignment-submission-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { submissionId } = params;
    const body = await boundedRequestJson(request);
    const submission =
      await publishAssignmentGrade(
        context,
        submissionId,
        body,
      );
    return NextResponse.json({ submission });
  },
);
