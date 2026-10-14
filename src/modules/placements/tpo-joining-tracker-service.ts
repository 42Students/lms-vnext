import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementJobs } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import { listPlacementJobOffers } from "./offer-service";
import { requirePlacementManageScope } from "./scope";
import { projectTpoJoiningTracker, tpoJoiningTrackerQuerySchema } from "./tpo-joining-tracker-model";

export async function getTpoJoiningTracker(context: RequestContext, raw: unknown) {
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const input = tpoJoiningTrackerQuerySchema.parse(raw);
  const [job] = await getDb().select({
    id: placementJobs.id,
    title: placementJobs.title,
    status: placementJobs.status,
    collegeId: placementJobs.collegeId,
  }).from(placementJobs).where(and(
    eq(placementJobs.id, input.jobId),
    eq(placementJobs.collegeId, collegeId),
  )).limit(1);
  if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  await requirePlacementManageScope(context, job.collegeId);
  const offers = await listPlacementJobOffers(context, job.id);
  return {
    job: { id: job.id, title: job.title, status: job.status },
    ...projectTpoJoiningTracker(offers),
  };
}
