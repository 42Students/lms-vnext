import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readMentorProjectCommandBody, MentorProjectCommandBodyError,
  mentorProjectBodyFailureMessage } from "@/modules/projects/mentor-command-body";
import { replaceProjectWorkspaceTemplate, searchWorkspaceAssignedTemplates }
  from "@/modules/projects/project-template-replace-service";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const { projectId } = await params;
    const search = new URL(request.url).searchParams.get("search") ?? "";
    if (search.length > 100) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }
    const templates = await searchWorkspaceAssignedTemplates(
      await getCurrentRequestContext(), projectId, search,
    );
    return NextResponse.json({ templates }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export async function POST(request: Request, { params }: Context) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { projectId } = await params;
    const input = await readMentorProjectCommandBody(request);
    return NextResponse.json(await replaceProjectWorkspaceTemplate(
      await getCurrentRequestContext(), projectId, input,
    ));
  } catch (error) {
    if (error instanceof MentorProjectCommandBodyError) {
      return NextResponse.json({ error: error.code,
        message: mentorProjectBodyFailureMessage(error.status) }, { status: error.status });
    }
    return apiErrorResponse(error);
  }
}
