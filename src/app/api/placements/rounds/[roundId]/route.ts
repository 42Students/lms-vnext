import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  getPlacementRound,
  updatePlacementRound,
} from "@/modules/placements/round-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { roundId } = params;
    const round = await getPlacementRound(
      context,
      roundId,
    );
    return NextResponse.json({ round });
  },
);

export const PATCH = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { roundId } = params;
    const round = await updatePlacementRound(
      context,
      roundId,
      await boundedRequestJson(request),
    );
    return NextResponse.json({ round });
  },
);
