import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createClassTeamWorkspaces } from "@/modules/projects/class-team-workspace-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const result = await createClassTeamWorkspaces(context, await request.json());
    return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch(error) {
    return apiErrorResponse(error);
  }
}
