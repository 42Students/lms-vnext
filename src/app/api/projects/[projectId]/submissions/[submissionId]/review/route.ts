import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  reviewProjectSubmission,
} from "@/modules/projects/submission-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId, submissionId } =
      params;
    const body = await boundedRequestJson(request);
    const result = await reviewProjectSubmission(
      context,
      projectId,
      submissionId,
      body,
    );
    return NextResponse.json(result);
  },
);
