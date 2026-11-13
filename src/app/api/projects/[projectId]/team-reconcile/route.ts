import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { reconcileProjectTeamRoster } from "@/modules/projects/project-team-roster-reconcile-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const { projectId } = params;
    const result = await reconcileProjectTeamRoster(
      __ctx, projectId,
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": CACHE.PRIVATE },
    });
  },
);
