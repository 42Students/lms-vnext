import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,
  mentorProjectBodyFailureMessage} from "@/modules/projects/mentor-command-body";
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
    const body = await readMentorProjectCommandBody(request);
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
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,
        message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status,headers:{"Cache-Control":"no-store"}});
    return apiErrorResponse(error);
  }
}
