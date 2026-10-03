import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listProjectMemberCandidates } from "@/modules/projects/member-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    const searchParams = new URL(request.url).searchParams;
    const candidates = await listProjectMemberCandidates(
      context,
      projectId,
      {
        role: searchParams.get("role"),
        q: searchParams.get("q") ?? "",
        limit: searchParams.get("limit") ?? undefined,
      },
    );

    return NextResponse.json({ candidates });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
