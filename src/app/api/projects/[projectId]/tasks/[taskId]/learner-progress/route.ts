import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { updateLearnerProjectTaskProgress } from "@/modules/projects/learner-task-progress-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ projectId: string; taskId: string }> };
export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const [context, path] = await Promise.all([getCurrentRequestContext(), params]);
    const task = await updateLearnerProjectTaskProgress(context, path, await request.json());
    return NextResponse.json({ task }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
