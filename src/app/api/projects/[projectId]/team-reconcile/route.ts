import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { reconcileProjectTeamRoster } from "@/modules/projects/project-team-roster-reconcile-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

async function handlePOST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { projectId } = await params;
    const result = await reconcileProjectTeamRoster(
      await getCurrentRequestContext(), projectId,
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
