import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { listProjectMemberCandidates } from "@/modules/projects/member-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId } = params;
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
  },
);
