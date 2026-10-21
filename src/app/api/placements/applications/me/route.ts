import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnPlacementApplications } from "@/modules/placements/application-service";

export const runtime = "nodejs";
/** Old /api/v1/jobs controller was split by resource and actor. Numeric
 * historic identifiers cannot be guessed into new scoped UUIDs.
 *
 * GET /api/v1/jobs/applications → GET /api/placements/applications/me
 * GET /api/v1/jobs → GET /api/placements/jobs/me
 * POST /api/v1/jobs/{id}/applications → POST /api/placements/jobs/{jobId}/applications
 * GET /api/v1/jobs/saved → GET /api/placements/learner/saved-jobs
 * GET /api/v1/jobs/calendar → GET /api/placements/learner/schedule
 * POST /api/v1/jobs/offers/{id}/respond → POST /api/placements/offers/{offerId}/actions
 */
export const LEGACY_LEARNER_JOBS_ROUTE_CROSSWALK = {
 ownApplications: "/api/placements/applications/me",
 jobs: "/api/placements/jobs/me",
 apply: "/api/placements/jobs/{jobId}/applications",
 saved: "/api/placements/learner/saved-jobs",
 calendar: "/api/placements/learner/schedule",
 offerResponse: "/api/placements/offers/{offerId}/actions",
} as const;

export async function GET() {
  try {
    const context = await getCurrentRequestContext();
    const applications =
      await listOwnPlacementApplications(context);
    return NextResponse.json({ applications });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
