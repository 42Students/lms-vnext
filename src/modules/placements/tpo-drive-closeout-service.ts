import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  placementApplications, placementApplicationScreenings, placementJobs,
  placementOffers, placementJoiningOutcomes,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { projectTpoDriveCloseout, tpoCloseoutJobSchema } from "./tpo-drive-closeout-model";
import { PlacementsServiceError } from "./errors";

export async function getTpoDriveCloseout(
  context: RequestContext, rawJobId: unknown,
) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = member.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);
  const jobId = tpoCloseoutJobSchema.parse(rawJobId);
  const db = getDb();
  const [job] = await db.select({
    id: placementJobs.id, title: placementJobs.title,
    status: placementJobs.status,
  }).from(placementJobs).where(and(
    eq(placementJobs.collegeId, collegeId), eq(placementJobs.id, jobId),
  )).limit(1);
  if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");

  const applications = await db.select({
    id: placementApplications.id,
    membershipId: placementApplications.membershipId,
    status: placementApplications.status,
    screeningStatus: placementApplicationScreenings.status,
  }).from(placementApplications)
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, placementApplications.membershipId))
    .leftJoin(placementApplicationScreenings, eq(
      placementApplicationScreenings.applicationId, placementApplications.id,
    )).where(and(
      eq(placementJobs.id, jobId),
      eq(placementJobs.collegeId, collegeId),
      eq(collegeMemberships.collegeId, collegeId),
    ));
  const offers = await db.select({
    id: placementOffers.id, applicationId: placementOffers.applicationId,
    membershipId: placementApplications.membershipId,
    status: placementOffers.status, joiningStatus: placementJoiningOutcomes.status,
  }).from(placementOffers)
    .innerJoin(placementApplications, eq(placementApplications.id, placementOffers.applicationId))
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, placementApplications.membershipId))
    .leftJoin(placementJoiningOutcomes, eq(placementJoiningOutcomes.offerId, placementOffers.id))
    .where(and(
      eq(placementJobs.id, jobId), eq(placementJobs.collegeId, collegeId),
      eq(collegeMemberships.collegeId, collegeId),
    ));
  return { job, counts: projectTpoDriveCloseout(applications, offers) };
}
