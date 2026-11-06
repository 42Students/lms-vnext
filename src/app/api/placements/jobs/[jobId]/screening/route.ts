import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { listPlacementScreeningQueue } from "@/modules/placements/screening-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const screening =
      await listPlacementScreeningQueue(
        context,
        jobId,
      );
    return NextResponse.json({ screening });
  },
);
