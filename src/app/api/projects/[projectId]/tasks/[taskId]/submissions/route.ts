import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listProjectTaskSubmissions,
  submitProjectTask,
} from "@/modules/projects/task-submission-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { projectId, taskId } = await params;
    const submissions =
      await listProjectTaskSubmissions(
        context,
        projectId,
        taskId,
      );

    return NextResponse.json({ submissions });
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
    const { projectId, taskId } = await params;
    const body = await request.json();
    const submission = await submitProjectTask(
      context,
      projectId,
      taskId,
      body,
    );

    return NextResponse.json(
      { submission },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
