import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createProjectEvaluation,
  getProjectEvaluation,
} from "@/modules/projects/evaluation-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    submissionId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { projectId, submissionId } =
      await params;
    const evaluation =
      await getProjectEvaluation(
        context,
        projectId,
        submissionId,
      );

    return NextResponse.json({ evaluation });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { projectId, submissionId } =
      await params;
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
  } catch (error) {
    return apiErrorResponse(error);
  }
}
