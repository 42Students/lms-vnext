import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  createProjectSubmissionDraft,
  listProjectSubmissions,
} from "@/modules/projects/submission-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { projectId } = params;
    const result = await listProjectSubmissions(
      context,
      projectId,
    );
    return NextResponse.json(result);
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId } = params;
    const body = await request.json();
    const submission =
      await createProjectSubmissionDraft(
        context,
        projectId,
        body,
      );
    return NextResponse.json(
      { submission },
      { status: 201 },
    );
  },
);
