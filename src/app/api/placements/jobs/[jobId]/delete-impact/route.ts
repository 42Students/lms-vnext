import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getPlacementJobStopImpact } from "@/modules/placements/job-service";
import { placementJobIdSchema } from "@/modules/placements/validation";

export const runtime = "nodejs";

/**
 * Legacy GET /jobs/{jobId}/delete-impact: the affected applications, offers
 * and open interviews are previewed BEFORE the destructive confirmation. The
 * read is scoped by the same job policy as GET /api/placements/jobs/{jobId}.
 */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    if (!placementJobIdSchema.safeParse(jobId).success) {
      return NextResponse.json({
        error: "PLACEMENT_JOB_NOT_FOUND",
        message: "The drive link is invalid or the drive no longer exists.",
      }, { status: 404 });
    }
    const impact = await getPlacementJobStopImpact(context, jobId);
    return NextResponse.json({ impact }, { headers: { "Cache-Control": "private, no-store" } });
  },
);
