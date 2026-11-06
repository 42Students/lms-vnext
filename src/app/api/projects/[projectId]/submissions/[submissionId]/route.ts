import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  updateProjectSubmissionDraft,
} from "@/modules/projects/submission-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "projects.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId, submissionId } =
      params;
    const body = await request.json();
    const submission =
      await updateProjectSubmissionDraft(
        context,
        projectId,
        submissionId,
        body,
      );
    return NextResponse.json({ submission });
  },
);
