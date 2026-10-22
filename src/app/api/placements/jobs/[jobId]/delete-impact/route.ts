import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getPlacementJobStopImpact } from "@/modules/placements/job-service";
import { placementJobIdSchema } from "@/modules/placements/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

/**
 * Legacy GET /jobs/{jobId}/delete-impact: the affected applications, offers
 * and open interviews are previewed BEFORE the destructive confirmation. The
 * read is scoped by the same job policy as GET /api/placements/jobs/{jobId}.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    if (!placementJobIdSchema.safeParse(jobId).success) {
      return NextResponse.json({
        error: "PLACEMENT_JOB_NOT_FOUND",
        message: "The drive link is invalid or the drive no longer exists.",
      }, { status: 404 });
    }
    const impact = await getPlacementJobStopImpact(context, jobId);
    return NextResponse.json({ impact }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
