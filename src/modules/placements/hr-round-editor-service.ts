import "server-only";
import {and,eq,gt,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs,placementCompanies,placementCompanyRelationships,placementRecruiterProfiles,
 placementRecruiterCollegeGrants,placementJobRounds,placementJobRoundEvents,
 placementRoundResults,activityEvents,colleges,organizations,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {hrRoundFormSchema,canRecruiterEditRound,duplicateRecruiterRoundName,matchesRecruiterRoundVersion} from "./hr-round-editor-model";
import {z} from "zod";
import {recruiterOwnJobPredicate} from "./recruiter-job-ownership";
import {hrInterviewSlots} from "@/db/schema/placement-hr-interview-slots";
import {notifyTpoOfRecruiterAction} from "./hr-tpo-notification-service";

/** Legacy RecruiterDriveController (117–180) coverage.
 * The source route owns selected-college authorization; vNext identifies an
 * active recruiter grant and UUID job instead. Unmapped actions MUST NOT be
 * treated as supported merely because the round editor exists.
 */
export const HR_LEGACY_DRIVE_ACTION_COVERAGE = {
 drives: { legacy: "GET /drives", vNext: "GET /api/placements/recruiter/jobs", state: "adapted" },
 rounds: { legacy: "GET /drives/{jobId}/rounds", vNext: "GET /api/placements/recruiter/drives/{jobId}/rounds", state: "adapted" },
 applicants: { legacy: "GET /drives/{jobId}/applicants", vNext: "GET /api/placements/recruiter/jobs/{jobId}/applicants", state: "adapted" },
 pipeline: { legacy: "GET /drives/{jobId}/pipeline", vNext: "hr-job-read-service", state: "verify-output-shape" },
 resumesZip: { legacy: "POST /drives/{jobId}/resumes", vNext: null, state: "not-verified" },
 roundCreate: { legacy: "POST /drives/{jobId}/rounds", vNext: "POST /api/placements/recruiter/drives/{jobId}/rounds", state: "adapted" },
 roundUpdate: { legacy: "PUT /drives/{jobId}/rounds/{roundId}", vNext: "POST /api/placements/recruiter/drives/{jobId}/rounds", state: "adapted-with-CAS" },
 roundDelete: { legacy: "DELETE /drives/{jobId}/rounds/{roundId}", vNext: "POST /api/placements/recruiter/drives/{jobId}/rounds", state: "cancelled-with-CAS" },
 results: { legacy: "POST /drives/{jobId}/rounds/{roundId}/results", vNext: null, state: "not-verified" },
 slotRead: { legacy: "GET /drives/{jobId}/rounds/{roundId}/slots", vNext: "hr-interview-slot-service", state: "verify-round-projection" },
 slotPropose: { legacy: "POST /drives/{jobId}/rounds/{roundId}/slots", vNext: "POST /api/placements/recruiter/drives/{jobId}/interview-slots", state: "single-slot-adapter" },
 selections: { legacy: "POST /drives/{jobId}/selections", vNext: null, state: "not-verified" },
} as const;

/** Recruiter round edits intentionally map destructive legacy removal to
 * CANCELLED + durable event history. PENDING and owner-only CAS prevents
 * rewriting a published or attended round, and a terminated drive is not
 * reopened through the editor. Clients can offer an access-ended notice. */
export const HR_ROUND_LIFECYCLE_COMPAT={
  legacyDelete:"DELETE",vNextLifecycle:"CANCELLED",keepsHistory:true,
  maxRoundNameLength:100,maxActiveRounds:12,
  duplicatePolicy:"case-insensitive Unicode NFKC, excludes cancelled",
} as const;
export function hrRoundEditorUnavailableMessage(code:string){
 return code==="PLACEMENT_JOB_NOT_FOUND"
  ?"This drive is over or your recruiter access has ended. Review an active drive to manage rounds."
  :code==="PLACEMENT_ROUND_STALE"
   ?"The round changed. Refresh the active drive before continuing."
   :"This round cannot be edited after scheduling, results, or interview slots are recorded.";
}
export async function editHrJobRound(context:RequestContext,rawJobId:unknown,raw:unknown){
 const jobId=z.string().uuid().parse(rawJobId),input=hrRoundFormSchema.parse(raw);
 if(context.recruiter?.status!=="ACTIVE"||context.recruiter.userId!==context.user.id)
  throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 return getDb().transaction(async tx=>{
  const [job]=await tx.select({
   id:placementJobs.id,collegeId:placementJobs.collegeId,organizationId:colleges.organizationId,status:placementJobs.status,
   companyRelationshipId:placementJobs.companyRelationshipId,
  }).from(placementJobs)
   .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
   .innerJoin(organizations,and(
    eq(organizations.id,colleges.organizationId),
    eq(organizations.status,"ACTIVE")))
   .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
    eq(placementCompanyRelationships.status,"ACTIVE"),
   ))
   .innerJoin(placementCompanies,and(
    eq(placementCompanies.id,placementCompanyRelationships.companyId),
    eq(placementCompanies.status,"ACTIVE")))
   .innerJoin(users,and(eq(users.id,context.user.id),eq(users.platformStatus,"ACTIVE")))
   .innerJoin(placementRecruiterProfiles,and(
    eq(placementRecruiterProfiles.userId,context.user.id),
    eq(placementRecruiterProfiles.companyId,placementCompanyRelationships.companyId),
    eq(placementRecruiterProfiles.status,"ACTIVE"),
   ))
   .innerJoin(placementRecruiterCollegeGrants,and(
    eq(placementRecruiterCollegeGrants.companyRelationshipId,placementCompanyRelationships.id),
    eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
    eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
    eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
    gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
    sql<boolean>`'DRIVES' = ANY(${placementRecruiterCollegeGrants.capabilities})`,
   ))
   .where(and(eq(placementJobs.id,jobId),inArray(placementJobs.status,["DRAFT","PUBLISHED"]),
    isNull(placementJobs.archivedAt),eq(colleges.status,"ACTIVE"),
    recruiterOwnJobPredicate(context.user.id)))
   .for("update").limit(1);
  if(!job||!can(context,"placements.recruiter.round.manage",{
   collegeId:job.collegeId,placementCompanyRelationshipId:job.companyRelationshipId,
  }))throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  const rounds=await tx.select({
   id:placementJobRounds.id,name:placementJobRounds.name,
   sequence:placementJobRounds.sequence,status:placementJobRounds.status,
   createdByUserId:placementJobRounds.createdByUserId,
   updatedAt:placementJobRounds.updatedAt,
  }).from(placementJobRounds).where(eq(placementJobRounds.jobId,job.id))
   .orderBy(placementJobRounds.sequence);
  const active=rounds.filter(row=>row.status!=="CANCELLED");
  if(input.action==="CREATE"){
   if(active.length>=12||duplicateRecruiterRoundName(active,input.name!))
    throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_EDITABLE");
   const [created]=await tx.insert(placementJobRounds).values({
    jobId:job.id,sequence:Math.max(0,...rounds.map(row=>row.sequence))+1,
    kind:input.kind!,name:input.name!,mode:input.mode??null,
    durationMinutes:input.durationMinutes??null,createdByUserId:context.user.id,
   }).returning({id:placementJobRounds.id});
   if(!created)throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_EDITABLE");
   await tx.insert(placementJobRoundEvents).values({
    roundId:created.id,eventType:"CREATED",actorUserId:context.user.id,
    metadata:{source:"RECRUITER",kind:input.kind,name:input.name},
   });
   await notifyTpoOfRecruiterAction(tx,context,{
    collegeId:job.collegeId,jobId:job.id,roundId:created.id,
    subjectId:created.id,action:"ROUND_CREATED",
   });
   return {id:created.id,action:"CREATED" as const};
  }
  const target=active.find(row=>row.id===input.roundId);
  if(!target)throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
  const [result]=await tx.select({id:placementRoundResults.id})
   .from(placementRoundResults).where(eq(placementRoundResults.roundId,target.id)).limit(1);
  const [attachedSlot]=await tx.select({id:hrInterviewSlots.id}).from(hrInterviewSlots)
   .where(and(eq(hrInterviewSlots.roundId,target.id),eq(hrInterviewSlots.jobId,job.id))).limit(1);
  if(!canRecruiterEditRound({status:target.status,createdByUserId:target.createdByUserId,
   recruiterUserId:context.user.id,hasResults:Boolean(result),hasSlots:Boolean(attachedSlot)}) ||
   !matchesRecruiterRoundVersion(target.updatedAt,input.expectedUpdatedAt))
   throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
  if(input.name&&duplicateRecruiterRoundName(active,input.name,target.id))
   throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_EDITABLE");
  const [updated]=await tx.update(placementJobRounds).set(input.action==="REMOVE"?
   {status:"CANCELLED",cancelledAt:new Date(),updatedAt:sql`greatest(clock_timestamp(),${placementJobRounds.updatedAt} + interval '1 millisecond')`}:
   {kind:input.kind,name:input.name,mode:input.mode,
    durationMinutes:input.durationMinutes,
    updatedAt:sql`greatest(clock_timestamp(),${placementJobRounds.updatedAt} + interval '1 millisecond')`})
   .where(and(eq(placementJobRounds.id,target.id),eq(placementJobRounds.status,"PENDING"),
    sql`date_trunc('milliseconds', ${placementJobRounds.updatedAt}) = ${target.updatedAt.toISOString()}::timestamptz`)).returning({id:placementJobRounds.id});
  if(!updated)throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
  await tx.insert(placementJobRoundEvents).values({
   roundId:target.id,eventType:input.action==="REMOVE"?"CANCELLED":"UPDATED",
   actorUserId:context.user.id,metadata:{source:"RECRUITER",action:input.action,
    ...(input.action==="UPDATE"?{kind:input.kind,name:input.name,mode:input.mode}:{}),
   },
  });
  await notifyTpoOfRecruiterAction(tx,context,{
   collegeId:job.collegeId,jobId:job.id,roundId:target.id,subjectId:target.id,
   action:input.action==="REMOVE"?"ROUND_REMOVED":"ROUND_UPDATED",
  });
  return {id:updated.id,action:input.action==="REMOVE"?"REMOVED" as const:"UPDATED" as const};
 });
}

/** The recruiter sees round metadata only, never internal candidate results. */
export async function listHrRoundEditorRows(context:RequestContext,jobIdInput:unknown){
 const jobId=z.string().uuid().parse(jobIdInput);
 if(context.recruiter?.status!=="ACTIVE"||context.recruiter.userId!==context.user.id)
  throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const [job]=await getDb().select({id:placementJobs.id,collegeId:placementJobs.collegeId,
  companyRelationshipId:placementJobs.companyRelationshipId})
  .from(placementJobs)
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
   eq(placementCompanyRelationships.status,"ACTIVE")))
  .innerJoin(colleges,and(
   eq(colleges.id,placementJobs.collegeId),
   eq(colleges.status,"ACTIVE")))
  .innerJoin(organizations,and(
   eq(organizations.id,colleges.organizationId),
   eq(organizations.status,"ACTIVE")))
  .innerJoin(placementCompanies,and(
   eq(placementCompanies.id,placementCompanyRelationships.companyId),
   eq(placementCompanies.status,"ACTIVE")))
  .innerJoin(users,and(eq(users.id,context.user.id),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(placementRecruiterProfiles,and(
   eq(placementRecruiterProfiles.userId,context.user.id),
   eq(placementRecruiterProfiles.companyId,placementCompanyRelationships.companyId),
   eq(placementRecruiterProfiles.status,"ACTIVE")))
  .innerJoin(placementRecruiterCollegeGrants,and(
   eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
   eq(placementRecruiterCollegeGrants.companyRelationshipId,placementCompanyRelationships.id),
   eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
    eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
    gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
    sql<boolean>`'DRIVES' = ANY(${placementRecruiterCollegeGrants.capabilities})`))
  .where(and(eq(placementJobs.id,jobId),
   inArray(placementJobs.status,["DRAFT","PUBLISHED"]),
   isNull(placementJobs.archivedAt),recruiterOwnJobPredicate(context.user.id))).limit(1);
 if(!job||!can(context,"placements.recruiter.round.manage",{
  collegeId:job.collegeId,placementCompanyRelationshipId:job.companyRelationshipId,
 }))throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const [rounds,used,slots]=await Promise.all([
  getDb().select({
   id:placementJobRounds.id,kind:placementJobRounds.kind,name:placementJobRounds.name,
   mode:placementJobRounds.mode,status:placementJobRounds.status,
   durationMinutes:placementJobRounds.durationMinutes,
   createdByUserId:placementJobRounds.createdByUserId,
   updatedAt:placementJobRounds.updatedAt,sequence:placementJobRounds.sequence,
  }).from(placementJobRounds).where(eq(placementJobRounds.jobId,jobId))
   .orderBy(placementJobRounds.sequence),
  getDb().select({roundId:placementRoundResults.roundId})
   .from(placementRoundResults).innerJoin(placementJobRounds,eq(placementJobRounds.id,placementRoundResults.roundId))
   .where(eq(placementJobRounds.jobId,jobId)).groupBy(placementRoundResults.roundId),
  getDb().select({roundId:hrInterviewSlots.roundId}).from(hrInterviewSlots)
   .where(eq(hrInterviewSlots.jobId,jobId)).groupBy(hrInterviewSlots.roundId),
 ]);
 const ids=new Set(used.map(row=>row.roundId));
 const slotIds=new Set(slots.map(row=>row.roundId));
 return rounds.filter(row=>row.status!=="CANCELLED").map(row=>({
  ...row,hasResults:ids.has(row.id),hasSlots:slotIds.has(row.id),
  editable:canRecruiterEditRound({status:row.status,createdByUserId:row.createdByUserId,
   recruiterUserId:context.user.id,hasResults:ids.has(row.id),hasSlots:slotIds.has(row.id)}),
 }));
}
