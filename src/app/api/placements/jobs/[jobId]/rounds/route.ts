import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  createPlacementRound,
  listPlacementRounds,
} from "@/modules/placements/round-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const rounds = await listPlacementRounds(
      context,
      jobId,
    );
    return NextResponse.json({ rounds });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const round = await createPlacementRound(
      context,
      jobId,
      await request.json(),
    );
    return NextResponse.json(
      { round },
      { status: 201 },
    );
  },
);
