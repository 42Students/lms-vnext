import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { listPlacementJobRequests } from "@/modules/placements/request-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "placements.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const requests =
      await listPlacementJobRequests(
        context,
        jobId,
      );
    return NextResponse.json({ requests });
  },
);
