import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  createProjectEvaluation,
  getProjectEvaluation,
} from "@/modules/projects/evaluation-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { projectId, submissionId } =
      params;
    const evaluation =
      await getProjectEvaluation(
        context,
        projectId,
        submissionId,
      );
    return NextResponse.json({ evaluation });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId, submissionId } =
      params;
    const body = await request.json();
    const evaluation =
      await createProjectEvaluation(
        context,
        projectId,
        submissionId,
        body,
      );
    return NextResponse.json(
      { evaluation },
      { status: 201 },
    );
  },
);
