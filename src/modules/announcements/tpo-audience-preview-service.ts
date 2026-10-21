import "server-only";
import {and,eq,exists,inArray,sql} from "drizzle-orm";
import { tpoPlacementAudienceSchema } from "./tpo-placement-audience-model";
import {getDb} from "@/db/client";
import {collegeMemberships,users,learnerProgramEnrollments,placementBatchRegistrations,placementApplications,placementJobs,programs,departments} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
/**
 * Preview number of ACTIVE college memberships with an ACTIVE platform user.
 * A visibility estimate, not a recipient list, notification or delivery count.
 */
export async function previewTpoCollegeAnnouncementVisibility(context:RequestContext){
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))
  throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [row]=await tx.select({
   total:sql<number>`count(*)::integer`,
   withEmail:sql<number>`count(*) filter (where nullif(trim(${users.email}), '') is not null)::integer`,
  })
   .from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(eq(collegeMemberships.collegeId,college.id),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")));
  return {potentiallyVisibleMemberships:Number(row?.total??0),
    withEmail:Number(row?.withEmail??0),emailReady:false as const,
    audience:"COLLEGE" as const};
 });
}

/** T-S2-07: exact preview kinds, no contact export and no implied delivery. */
/** A count of ACTIVE matching memberships, not a recipient list or consent. */
export async function previewTpoPlacementAudience(context:RequestContext,raw:unknown){
 const audience=tpoPlacementAudienceSchema.parse(raw);
 const member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO"))
   throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,member.collegeId);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const enrollmentBase=tx.select({id:learnerProgramEnrollments.id})
    .from(learnerProgramEnrollments)
    .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
    .innerJoin(departments,eq(departments.id,programs.departmentId));
  let audienceCondition;
  if(audience.kind==="PLACEMENTS"){
   audienceCondition=exists(enrollmentBase.innerJoin(placementBatchRegistrations,and(
    eq(placementBatchRegistrations.membershipId,learnerProgramEnrollments.membershipId),
    eq(placementBatchRegistrations.cohortId,learnerProgramEnrollments.cohortId),
    eq(placementBatchRegistrations.collegeId,college.id),
   )).where(and(
    eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
    eq(learnerProgramEnrollments.status,"ACTIVE"),
    eq(departments.collegeId,college.id),
    eq(placementBatchRegistrations.choice,"PLACEMENTS"),
   )));
  }else if(audience.kind==="BATCHES"){
   audienceCondition=exists(enrollmentBase.where(and(
    eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
    eq(learnerProgramEnrollments.status,"ACTIVE"),
    eq(departments.collegeId,college.id),
    inArray(learnerProgramEnrollments.cohortId,audience.cohortIds),
   )));
  }else if(audience.kind==="BRANCHES"){
   audienceCondition=exists(enrollmentBase.where(and(
    eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
    eq(learnerProgramEnrollments.status,"ACTIVE"),
    eq(departments.collegeId,college.id),
    inArray(departments.id,audience.departmentIds),
   )));
  }else{
   audienceCondition=exists(tx.select({id:placementApplications.id})
    .from(placementApplications).innerJoin(placementJobs,
      eq(placementJobs.id,placementApplications.jobId))
    .where(and(eq(placementApplications.membershipId,collegeMemberships.id),
      eq(placementJobs.collegeId,college.id),
      eq(placementJobs.id,audience.jobId),
      eq(placementApplications.status,"SUBMITTED"))));
  }
  const [counted]=await tx.select({
    total:sql<number>`count(distinct ${collegeMemberships.id})::integer`,
    withEmail:sql<number>`count(distinct case when nullif(trim(${users.email}), '') is not null then ${collegeMemberships.id} end)::integer`,
  }).from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(
      eq(collegeMemberships.collegeId,college.id),
      eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE"),
      audienceCondition,
    ));
  return {audience:audience.kind,potentiallyVisibleMemberships:Number(counted?.total??0),
    withEmail:Number(counted?.withEmail??0),emailReady:false as const,
    previewOnly:true as const};
 });
}
