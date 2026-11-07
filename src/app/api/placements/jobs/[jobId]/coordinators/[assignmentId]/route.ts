import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { removeDriveDayCoordinator } from "@/modules/placements/drive-day-coordinator-service";

export const runtime = "nodejs";

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { jobId, assignmentId } =
      params;
    const assignment =
      await removeDriveDayCoordinator(
        context,
        jobId,
        assignmentId,
      );
    return NextResponse.json({ assignment });
  },
);
