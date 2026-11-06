import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readMentorProjectCommandBody, MentorProjectCommandBodyError,
  mentorProjectBodyFailureMessage } from "@/modules/projects/mentor-command-body";
import { saveProjectTaskPlan } from "@/modules/projects/project-task-plan-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ projectId: string }> };

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const { projectId } = params;
    const input = await readMentorProjectCommandBody(request);
    return NextResponse.json(
      await saveProjectTaskPlan(__ctx, projectId, input),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  },
);
