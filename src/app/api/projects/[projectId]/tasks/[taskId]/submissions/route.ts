import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {submitProjectTaskInputSchema} from "@/modules/projects/validation";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,
  mentorProjectBodyFailureMessage} from "@/modules/projects/mentor-command-body";
import {
  listProjectTaskSubmissions,
  submitProjectTask,
} from "@/modules/projects/task-submission-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const context = __actor!;
    const { projectId, taskId } = params;
    const submissions =
      await listProjectTaskSubmissions(
        context,
        projectId,
        taskId,
      );
    return NextResponse.json({ submissions });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { projectId, taskId } = params;
const body = submitProjectTaskInputSchema.parse(await readMentorProjectCommandBody(request));
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
        {status:error.status,headers:{"Cache-Control":CACHE.NONE}});
    return apiErrorResponse(error);
  }
  },
);
