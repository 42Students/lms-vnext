import { boundedRequestJson } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { updateLearnerProjectTaskProgress } from "@/modules/projects/learner-task-progress-service";
import { route } from "@/security/route";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";
type RouteContext = { params: Promise<{ projectId: string; taskId: string }> };
async function handlePATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const [context, path] = await Promise.all([getCurrentRequestContext(), params]);
    const task = await updateLearnerProjectTaskProgress(context, path, await boundedRequestJson(request));
    return privateJson({ task });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePATCH(request as Parameters<typeof handlePATCH>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePATCH>[1]),
);
