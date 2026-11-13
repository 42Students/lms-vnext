import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readMentorProjectCommandBody, MentorProjectCommandBodyError,
  mentorProjectBodyFailureMessage } from "@/modules/projects/mentor-command-body";
import { replaceProjectWorkspaceTemplate, searchWorkspaceAssignedTemplates }
  from "@/modules/projects/project-template-replace-service";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const { projectId } = params;
    const search = new URL(request.url).searchParams.get("search") ?? "";
    if (search.length > 100) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }
    const templates = await searchWorkspaceAssignedTemplates(
      __ctx, projectId, search,
    );
    return privateJson({ templates });
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const { projectId } = params;
const input = await readMentorProjectCommandBody(request);
return NextResponse.json(await replaceProjectWorkspaceTemplate(
      __ctx, projectId, input,
    ));
} catch (error) {
    if (error instanceof MentorProjectCommandBodyError) {
      return NextResponse.json({ error: error.code,
        message: mentorProjectBodyFailureMessage(error.status) }, { status: error.status });
    }
    return apiErrorResponse(error);
  }
  },
);
