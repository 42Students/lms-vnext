import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementApplications, placementJobs, placementApplicationScreenings } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requireTpoJobCollege } from "./tpo-job-write-base";
import { tpoApplicantDetailQuerySchema } from "./tpo-applicant-detail-model";
import { tpoApplicantReviewSchema, canReviewApplicant, candidateScreeningPayload } from "./tpo-applicant-review-model";
import { decidePlacementScreening } from "./screening-service";

export async function reviewTpoApplicant(
  context: RequestContext, rawParams: unknown, rawInput: unknown,
) {
  const collegeId = await requireTpoJobCollege(context);
  const params = tpoApplicantDetailQuerySchema.parse(rawParams);
  const input = tpoApplicantReviewSchema.parse(rawInput);
  const [owned] = await getDb().select({
    applicationId: placementApplications.id,
    applicationStatus: placementApplications.status,
    screeningStatus: placementApplicationScreenings.status,
    screeningUpdatedAt: placementApplicationScreenings.updatedAt,
  }).from(placementApplications)
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .leftJoin(placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId, placementApplications.id))
    .where(and(eq(placementJobs.collegeId, collegeId),
      eq(placementJobs.id, params.jobId),
      eq(placementApplications.id, params.applicationId),
      eq(placementJobs.status, "PUBLISHED"))).limit(1);
  if (!owned) throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
  if (!owned.screeningUpdatedAt ||
      owned.screeningUpdatedAt.toISOString() !== input.expectedUpdatedAt) {
    throw new PlacementsServiceError("PLACEMENT_SCREENING_STALE");
  }
  if (!canReviewApplicant(owned.applicationStatus, owned.screeningStatus)) {
    throw new PlacementsServiceError("PLACEMENT_SCREENING_INVALID_TRANSITION");
  }
  return decidePlacementScreening(context, params.applicationId,
    candidateScreeningPayload(input), input.expectedUpdatedAt);
}
