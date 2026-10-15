import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs,placementCompanyRelationships,placementRecruiterProfiles,
 placementRecruiterCollegeGrants,placementJobRounds,placementJobRoundEvents,
 placementRoundResults,activityEvents,colleges} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {hrRoundFormSchema,canRecruiterEditRound,duplicateRecruiterRoundName} from "./hr-round-editor-model";
import {z} from "zod";

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
   .where(and(eq(placementJobs.id,jobId),eq(placementJobs.status,"PUBLISHED")))
   .for("update").limit(1);
  if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
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
   await tx.insert(activityEvents).values({
    organizationId:job.organizationId,
    collegeId:job.collegeId,actorUserId:context.user.id,module:"PLACEMENTS",
    eventType:"placements.hr_round.created",subjectType:"placement_round",subjectId:created.id,
    summary:"Recruiter added hiring round",metadata:{jobId:job.id},
   });
   return {id:created.id,action:"CREATED" as const};
  }
  const target=active.find(row=>row.id===input.roundId);
  if(!target)throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
  const [result]=await tx.select({id:placementRoundResults.id})
   .from(placementRoundResults).where(eq(placementRoundResults.roundId,target.id)).limit(1);
  if(!canRecruiterEditRound({status:target.status,createdByUserId:target.createdByUserId,
   recruiterUserId:context.user.id,hasResults:Boolean(result)}) ||
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
  await tx.insert(activityEvents).values({
   organizationId:job.organizationId,collegeId:job.collegeId,
   actorUserId:context.user.id,module:"PLACEMENTS",
   eventType:input.action==="REMOVE"?"placements.hr_round.removed":"placements.hr_round.updated",
   subjectType:"placement_round",subjectId:target.id,
   summary:input.action==="REMOVE"?"Recruiter removed unused hiring round":"Recruiter edited unused hiring round",
   metadata:{jobId:job.id},
  });
  return {id:updated.id,action:input.action==="REMOVE"?"REMOVED" as const:"UPDATED" as const};
 });
}
