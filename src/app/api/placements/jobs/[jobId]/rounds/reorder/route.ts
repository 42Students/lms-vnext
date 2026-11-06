import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { reorderPlacementRounds } from "@/modules/placements/round-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const rounds = await reorderPlacementRounds(
      context,
      jobId,
      await request.json(),
    );
    return NextResponse.json({ rounds });
  },
);
