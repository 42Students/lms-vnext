import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, placementApplications, placementApplicationScreenings, placementJobRoleOptions,
  placementJobs, users } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { PlacementsServiceError } from "./errors";
import { projectTpoApplicantPipeline, tpoApplicantPipelineParams } from "./tpo-applicant-pipeline-model";
export async function getTpoApplicantPipeline(context: RequestContext, raw: unknown) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context,"TPO") ||
      membership.status!=="ACTIVE" || context.user.platformStatus!=="ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId=membership.collegeId;
  if(!can(context,"placements.manage",{collegeId})) throw new AuthorizationError("placements.manage");
  requirePermission(context,"placements.manage",{collegeId});
  const input=tpoApplicantPipelineParams.parse(raw);
  await requirePlacementManageScope(context,collegeId);
  const db=getDb();
  const [job]=await db.select({id:placementJobs.id,title:placementJobs.title,status:placementJobs.status})
    .from(placementJobs)
    .where(and(eq(placementJobs.id,input.jobId),eq(placementJobs.collegeId,collegeId),
      isNull(placementJobs.archivedAt))).limit(1);
  if(!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  const records=await db.select({
    id:placementApplications.id,
    student:users.displayName,
    role:placementJobRoleOptions.title,
    applicationStatus:placementApplications.status,
    screeningStatus:placementApplicationScreenings.status,
    screeningUpdatedAt:placementApplicationScreenings.updatedAt,
    eligibilityStatus:placementApplications.eligibilityStatus,
    channel:placementApplications.channel,
    submittedAt:placementApplications.submittedAt,
  }).from(placementApplications)
    .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
      eq(collegeMemberships.collegeId,collegeId)))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
      eq(placementJobRoleOptions.jobId,job.id)))
    .leftJoin(placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId,placementApplications.id))
    .where(eq(placementApplications.jobId,job.id))
    .orderBy(placementApplications.submittedAt,placementApplications.id)
    .limit(501);
  const out=projectTpoApplicantPipeline(records.slice(0,500).map(row=>({
    ...row,submittedAt:row.submittedAt.toISOString(),
    screeningUpdatedAt:row.screeningUpdatedAt?.toISOString()??null,
  })),input.stage,input.search);
  return {job,stage:input.stage,search:input.search,truncated:records.length>500,...out};
}
