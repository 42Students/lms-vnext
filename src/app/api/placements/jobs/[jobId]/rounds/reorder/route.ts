import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { reorderPlacementRounds } from "@/modules/placements/round-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const rounds = await reorderPlacementRounds(
      context,
      jobId,
      await boundedRequestJson(request),
    );
    return NextResponse.json({ rounds });
  },
);
