import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { actOnPlacementRound } from "@/modules/placements/round-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { roundId } = params;
    const round = await actOnPlacementRound(
      context,
      roundId,
      await boundedRequestJson(request),
    );
    return NextResponse.json({ round });
  },
);
