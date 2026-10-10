import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  reopenProjectSprint,
} from "@/modules/projects/lifecycle-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    sprintId: string;
  }>;
};

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
    const { projectId, sprintId } = await params;
    const sprint = await reopenProjectSprint(
      context,
      projectId,
      sprintId,
    );

    return NextResponse.json({ sprint });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
