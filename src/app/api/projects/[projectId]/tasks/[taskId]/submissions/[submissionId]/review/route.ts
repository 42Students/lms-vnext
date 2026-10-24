import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {reviewProjectTaskSubmissionInputSchema} from "@/modules/projects/validation";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,
  mentorProjectBodyFailureMessage} from "@/modules/projects/mentor-command-body";
import {
  reviewProjectTaskSubmission,
} from "@/modules/projects/task-submission-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
    submissionId: string;
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
    const {
      projectId,
      taskId,
      submissionId,
    } = await params;
    const body = reviewProjectTaskSubmissionInputSchema.parse(await readMentorProjectCommandBody(request));
    const result =
      await reviewProjectTaskSubmission(
        context,
        projectId,
        taskId,
        submissionId,
        body,
      );

    return NextResponse.json(result);
  } catch (error) {
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,
        message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status,headers:{"Cache-Control":"no-store"}});
    return apiErrorResponse(error);
  }
}
