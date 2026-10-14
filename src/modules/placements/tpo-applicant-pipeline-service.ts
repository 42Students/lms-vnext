import "server-only";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, placementApplications, placementApplicationScreenings, placementJobRoleOptions,
  placementJobs, users } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { PlacementsServiceError } from "./errors";
import { tpoApplicantPipelinePage, tpoApplicantPipelineParams } from "./tpo-applicant-pipeline-model";
import {tpoApplicantExportSearchPattern} from "./tpo-drive-applications-export-model";
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
  const projection=await db.transaction(async tx=>{
   const scope=and(eq(placementApplications.jobId,job.id),
    input.channel!=="ALL"?eq(placementApplications.channel,input.channel):undefined,
    input.search?or(
    ilike(users.displayName,tpoApplicantExportSearchPattern(input.search)),
    ilike(placementJobRoleOptions.title,tpoApplicantExportSearchPattern(input.search))):undefined);
   const stage=sql`case when ${placementApplications.status} = 'WITHDRAWN' then 'WITHDRAWN'
    when ${placementApplicationScreenings.status} in ('SHORTLISTED','HOLD','REJECTED')
    then ${placementApplicationScreenings.status}::text else 'PENDING' end`;
   const [counts]=await tx.select({all:sql<number>`count(*)::int`,
    submitted:sql<number>`count(*) filter(where ${placementApplications.status} = 'SUBMITTED')::int`,
    pending:sql<number>`count(*) filter(where ${stage} = 'PENDING')::int`,
    hold:sql<number>`count(*) filter(where ${stage} = 'HOLD')::int`,
    shortlisted:sql<number>`count(*) filter(where ${stage} = 'SHORTLISTED')::int`,
    rejected:sql<number>`count(*) filter(where ${stage} = 'REJECTED')::int`,
    withdrawn:sql<number>`count(*) filter(where ${stage} = 'WITHDRAWN')::int`,
   }).from(placementApplications)
    .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
     eq(collegeMemberships.collegeId,collegeId)))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
     eq(placementJobRoleOptions.jobId,job.id)))
    .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
    .where(scope);
   const totals=counts??{all:0,submitted:0,pending:0,hold:0,shortlisted:0,rejected:0,withdrawn:0};
   const totalMatching=input.stage==="ALL"?totals.all:
    input.stage==="SUBMITTED"?totals.submitted:
    input.stage==="PENDING"?totals.pending:input.stage==="HOLD"?totals.hold:
    input.stage==="SHORTLISTED"?totals.shortlisted:input.stage==="REJECTED"?totals.rejected:totals.withdrawn;
   const pagination=tpoApplicantPipelinePage(totalMatching,input.page);
   const records=await tx.select({
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
    .where(and(scope,input.stage==="ALL"?undefined:input.stage==="SUBMITTED"?
     eq(placementApplications.status,"SUBMITTED"):sql`${stage} = ${input.stage}::text`))
    .orderBy(desc(placementApplications.submittedAt),placementApplications.id)
    .limit(pagination.pageSize).offset(pagination.offset);
   return {counts:totals,...pagination,rows:records.map(row=>({
    ...row,submittedAt:row.submittedAt.toISOString(),
    screeningUpdatedAt:row.screeningUpdatedAt?.toISOString()??null,
   }))};
  },{isolationLevel:"repeatable read",accessMode:"read only"});
  return {job,stage:input.stage,search:input.search,channel:input.channel,...projection};
}
