import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "placements.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const driveDay = await getPlacementDriveDay(
      context,
      jobId,
    );
    return NextResponse.json({ driveDay });
  },
);
