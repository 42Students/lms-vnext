import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs,placementCompanyRelationships,placementRecruiterProfiles,
 placementRecruiterCollegeGrants,placementJobRounds,placementJobRoundEvents,
 placementRoundResults,activityEvents,colleges} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {hrRoundFormSchema,canRecruiterEditRound,duplicateRecruiterRoundName} from "./hr-round-editor-model";
import {z} from "zod";
import {recruiterOwnJobPredicate} from "./recruiter-job-ownership";
import {hrInterviewSlots} from "@/db/schema/placement-hr-interview-slots";
import {notifyTpoOfRecruiterAction} from "./hr-tpo-notification-service";

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
   .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
    eq(placementCompanyRelationships.status,"ACTIVE"),
   ))
   .innerJoin(placementRecruiterProfiles,and(
    eq(placementRecruiterProfiles.userId,context.user.id),
    eq(placementRecruiterProfiles.companyId,placementCompanyRelationships.companyId),
    eq(placementRecruiterProfiles.status,"ACTIVE"),
   ))
   .innerJoin(placementRecruiterCollegeGrants,and(
    eq(placementRecruiterCollegeGrants.companyRelationshipId,placementCompanyRelationships.id),
    eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
    eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
   ))
   .where(and(eq(placementJobs.id,jobId),eq(placementJobs.status,"PUBLISHED"),
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
   target.updatedAt.toISOString()!==input.expectedUpdatedAt)
   throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
  if(input.name&&duplicateRecruiterRoundName(active,input.name,target.id))
   throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_EDITABLE");
  const [updated]=await tx.update(placementJobRounds).set(input.action==="REMOVE"?
   {status:"CANCELLED",cancelledAt:new Date(),updatedAt:sql`greatest(clock_timestamp(),${placementJobRounds.updatedAt} + interval '1 millisecond')`}:
   {kind:input.kind,name:input.name,mode:input.mode,
    durationMinutes:input.durationMinutes,
    updatedAt:sql`greatest(clock_timestamp(),${placementJobRounds.updatedAt} + interval '1 millisecond')`})
   .where(and(eq(placementJobRounds.id,target.id),eq(placementJobRounds.status,"PENDING"),
    eq(placementJobRounds.updatedAt,target.updatedAt))).returning({id:placementJobRounds.id});
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
 const {getRecruiterPlacementWorkspace}=await import("./recruiter-workspace-service");
 await getRecruiterPlacementWorkspace(context,jobId);
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
