import "server-only";
import {and,eq,gt,lt,ne,inArray,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementJobs,placementCompanies,placementCompanyRelationships,placementRecruiterProfiles,
 placementRecruiterCollegeGrants,placementJobRounds,activityEvents,colleges,organizations,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import type {TpoJobTx} from "./tpo-job-write-base";
import {hrInterviewSlots} from "@/db/schema/placement-hr-interview-slots";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import {hrInterviewSlotCreateSchema,hrInterviewSlotActionSchema,slotTransitionAllowed,canRecruiterMutateOwnSlot} from "./hr-interview-slot-model";
import {PlacementsServiceError} from "./errors";
import {recruiterOwnJobPredicate} from "./recruiter-job-ownership";
import {notifyTpoOfRecruiterAction} from "./hr-tpo-notification-service";

type JobScope={id:string;collegeId:string;organizationId:string;companyRelationshipId:string};
async function verifyRecruiterSlotJob(tx:TpoJobTx,context:RequestContext,jobId:string):Promise<JobScope>{
 if(context.recruiter?.status!=="ACTIVE"||context.recruiter.userId!==context.user.id)
  throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const [job]=await tx.select({
   id:placementJobs.id,collegeId:placementJobs.collegeId,organizationId:colleges.organizationId,
   companyRelationshipId:placementJobs.companyRelationshipId,
  }).from(placementJobs)
  .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
  .innerJoin(organizations,and(
   eq(organizations.id,colleges.organizationId),
   eq(organizations.status,"ACTIVE")))
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
   eq(placementCompanyRelationships.status,"ACTIVE")))
  .innerJoin(placementCompanies,
   eq(placementCompanies.id,placementCompanyRelationships.companyId))
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
  .where(and(eq(placementJobs.id,jobId),eq(placementJobs.status,"PUBLISHED"),
    isNull(placementJobs.archivedAt),
    eq(placementCompanies.status,"ACTIVE"),eq(colleges.status,"ACTIVE"),
    recruiterOwnJobPredicate(context.user.id)))
  .for("update").limit(1);
 if(!job||!can(context,"placements.recruiter.read",{
  collegeId:job.collegeId,placementCompanyRelationshipId:job.companyRelationshipId,
 }))throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 return job;
}
export async function listHrInterviewSlots(context:RequestContext,rawJobId:unknown){
 const jobId=z.string().uuid().parse(rawJobId);
 // Always authorize before reading the registered slots table.
 return getDb().transaction(async tx=>{
  const job=await verifyRecruiterSlotJob(tx,context,jobId);
  const rows=await tx.select({
   id:hrInterviewSlots.id,roundId:hrInterviewSlots.roundId,
   startAt:hrInterviewSlots.startAt,endAt:hrInterviewSlots.endAt,
   mode:hrInterviewSlots.mode,panelLabel:hrInterviewSlots.panelLabel,
   meetingLocation:hrInterviewSlots.meetingLocation,
   capacity:hrInterviewSlots.capacity,bookedCount:hrInterviewSlots.bookedCount,
   status:hrInterviewSlots.status,version:hrInterviewSlots.version,
   createdByUserId:hrInterviewSlots.createdByUserId,
  }).from(hrInterviewSlots).innerJoin(placementJobRounds,and(
   eq(placementJobRounds.id,hrInterviewSlots.roundId),
   eq(placementJobRounds.jobId,job.id)))
   .where(eq(hrInterviewSlots.collegeId,job.collegeId))
   .orderBy(hrInterviewSlots.startAt).limit(100);
  const now=new Date();
  return {status:"READY" as const,items:rows.map(row=>({
   id:row.id,roundId:row.roundId,startAt:row.startAt,endAt:row.endAt,
   mode:row.mode,panelLabel:row.panelLabel,meetingLocation:row.meetingLocation,capacity:row.capacity,
   bookedCount:row.bookedCount,status:row.status,version:row.version,
   isOwn:canRecruiterMutateOwnSlot(row.createdByUserId,context.user.id),
   canEdit:canRecruiterMutateOwnSlot(row.createdByUserId,context.user.id)&&row.startAt>now,
  }))};
 });
}
export async function writeHrInterviewSlot(
 context:RequestContext,rawJobId:unknown,raw:unknown,
){
 const jobId=z.string().uuid().parse(rawJobId);
 const actionType=z.enum(["CREATE","OFFER","BOOK","CANCEL"]).parse((raw as {action?:unknown}|null)?.action);
 const data=actionType==="CREATE"?hrInterviewSlotCreateSchema.parse(raw):
  hrInterviewSlotActionSchema.parse(raw);
 return getDb().transaction(async tx=>{
  const job=await verifyRecruiterSlotJob(tx,context,jobId);
  if(!can(context,"placements.recruiter.slot.manage",{
   collegeId:job.collegeId,placementCompanyRelationshipId:job.companyRelationshipId,
  }))throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  if(actionType==="CREATE"){
   const input=hrInterviewSlotCreateSchema.parse(data);
   if(input.startAt<=new Date()||input.startAt.getTime()>Date.now()+180*86400000)
    throw new Error("INVALID_SLOT_DATE");
   const [round]=await tx.select({id:placementJobRounds.id})
    .from(placementJobRounds).where(and(
     eq(placementJobRounds.id,input.roundId),eq(placementJobRounds.jobId,job.id),
     eq(placementJobRounds.kind,"INTERVIEW"),
     inArray(placementJobRounds.status,["PENDING","SCHEDULED"])))
    .limit(1);
   if(!round)throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
   // Lock the college before examining any room in this college. Locking only
   // the drive or recruiter account permits two different recruiters to book
   // the same room concurrently on different drives.
   await tx.select({id:colleges.id}).from(colleges)
    .where(eq(colleges.id,job.collegeId)).for("update").limit(1);
   // Also serialize this recruiter's proposals across colleges. Aggregate
   // slots contain no learner identity; TPO's candidate booking service owns
   // the cross-drive learner conflict check.
   await tx.select({id:users.id}).from(users)
    .where(eq(users.id,context.user.id)).for("update").limit(1);
   const [roundConflict]=await tx.select({id:hrInterviewSlots.id})
    .from(hrInterviewSlots).where(and(
      eq(hrInterviewSlots.roundId,round.id),
      eq(hrInterviewSlots.collegeId,job.collegeId),
      ne(hrInterviewSlots.status,"CANCELLED"),
      lt(hrInterviewSlots.startAt,input.endAt),
      gt(hrInterviewSlots.endAt,input.startAt),
    )).limit(1);
   if(roundConflict)throw new Error("SLOT_OVERLAP");
   const [recruiterConflict]=await tx.select({id:hrInterviewSlots.id})
    .from(hrInterviewSlots)
    .where(and(eq(hrInterviewSlots.createdByUserId,context.user.id),
      ne(hrInterviewSlots.status,"CANCELLED"),
      lt(hrInterviewSlots.startAt,input.endAt),
      gt(hrInterviewSlots.endAt,input.startAt)))
    .limit(1);
   // The recruiter slot route translates this code to HTTP 409; using an
   // unrecognized conflict target previously caused HTTP 500.
   if(recruiterConflict)throw new Error("SLOT_OVERLAP");
   // A named on-campus room is a college resource, not a recruiter-owned
   // resource. The college row lock in verifyRecruiterSlotJob serializes
   // competing recruiter proposals for this college before this predicate.
   // Do not treat blank/general venues as unique room identifiers.
   if(input.mode==="ON_CAMPUS" && input.meetingLocation?.trim()){
    const room=input.meetingLocation.trim().toLocaleLowerCase("en-IN");
    const [roomConflict]=await tx.select({id:hrInterviewSlots.id})
     .from(hrInterviewSlots).where(and(
      eq(hrInterviewSlots.collegeId,job.collegeId),
      eq(hrInterviewSlots.mode,"ON_CAMPUS"),
      ne(hrInterviewSlots.status,"CANCELLED"),
      sql`lower(btrim(${hrInterviewSlots.meetingLocation})) = ${room}`,
      lt(hrInterviewSlots.startAt,input.endAt),
      gt(hrInterviewSlots.endAt,input.startAt),
     )).limit(1);
    if(roomConflict)throw new Error("SLOT_OVERLAP");
    // A TPO-confirmed room booking also occupies this venue, including
    // when that booking belongs to another interview round or drive.
    const [candidateRoomConflict]=await tx.select({id:placementRoundCandidateSlots.id})
     .from(placementRoundCandidateSlots)
     .innerJoin(placementJobs,eq(placementJobs.id,placementRoundCandidateSlots.jobId))
     .where(and(
      eq(placementJobs.collegeId,job.collegeId),
      ne(placementRoundCandidateSlots.status,"CANCELLED"),
      sql`lower(btrim(${placementRoundCandidateSlots.room})) = ${room}`,
      lt(placementRoundCandidateSlots.startsAt,input.endAt),
      gt(placementRoundCandidateSlots.endsAt,input.startAt),
     )).limit(1);
    if(candidateRoomConflict)throw new Error("SLOT_OVERLAP");
   }
   const [newSlot]=await tx.insert(hrInterviewSlots).values({
    collegeId:job.collegeId,jobId:job.id,roundId:round.id,startAt:input.startAt,endAt:input.endAt,
    timezone:input.timezone,mode:input.mode,meetingLocation:input.meetingLocation??null,
    panelLabel:input.panelLabel??null,capacity:input.capacity,createdByUserId:context.user.id,
   }).returning({id:hrInterviewSlots.id,version:hrInterviewSlots.version,
    startAt:hrInterviewSlots.startAt,endAt:hrInterviewSlots.endAt});
   if(!newSlot)throw new Error("SLOT_CREATE_FAILED");
   await notifyTpoOfRecruiterAction(tx,context,{
    collegeId:job.collegeId,jobId:job.id,roundId:round.id,
    subjectId:newSlot.id,action:"SLOT_PROPOSED",
   });
   return {id:newSlot.id,status:"PROPOSED" as const,version:newSlot.version,
    startAt:newSlot.startAt.toISOString(),endAt:newSlot.endAt.toISOString()};
  }
  const input=hrInterviewSlotActionSchema.parse(data);
  const [slot]=await tx.select({
   id:hrInterviewSlots.id,roundId:hrInterviewSlots.roundId,status:hrInterviewSlots.status,
   version:hrInterviewSlots.version,bookedCount:hrInterviewSlots.bookedCount,
   capacity:hrInterviewSlots.capacity,createdByUserId:hrInterviewSlots.createdByUserId,
   startAt:hrInterviewSlots.startAt,endAt:hrInterviewSlots.endAt,
  }).from(hrInterviewSlots).innerJoin(placementJobRounds,and(
   eq(placementJobRounds.id,hrInterviewSlots.roundId),eq(placementJobRounds.jobId,job.id)))
   .where(and(eq(hrInterviewSlots.id,input.slotId),eq(hrInterviewSlots.collegeId,job.collegeId)))
   .for("update").limit(1);
  if(!slot||!canRecruiterMutateOwnSlot(slot.createdByUserId,context.user.id))
   throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
  if(input.expectedVersion!==slot.version || slot.startAt<=new Date() ||
     !slotTransitionAllowed(slot.status,input.action,slot.bookedCount,slot.capacity))
   throw new Error("SLOT_STALE");
  const next=input.action==="OFFER"?"OFFERED":input.action==="BOOK"?"BOOKED":"CANCELLED";
  const bookedCount=input.action==="BOOK"?slot.bookedCount+1:slot.bookedCount;
  if(bookedCount>slot.capacity)throw new Error("SLOT_FULL");
  const [updated]=await tx.update(hrInterviewSlots).set({
   status:next,bookedCount,version:slot.version+1,updatedAt:new Date(),
  }).where(and(eq(hrInterviewSlots.id,slot.id),eq(hrInterviewSlots.version,slot.version)))
   .returning({id:hrInterviewSlots.id,version:hrInterviewSlots.version});
  if(!updated)throw new Error("SLOT_STALE");
  // A local BOOK reservation does not mean that the placement cell
  // confirmed learner bookings; notify on OFFER and cancellation instead.
  if(input.action==="OFFER"||input.action==="CANCEL"){
   await notifyTpoOfRecruiterAction(tx,context,{
    collegeId:job.collegeId,jobId:job.id,roundId:slot.roundId,
    subjectId:slot.id,action:input.action==="OFFER"?"SLOT_OFFERED":"SLOT_CANCELLED",
   });
  }else{
   await tx.insert(activityEvents).values({
    organizationId:job.organizationId,collegeId:job.collegeId,actorUserId:context.user.id,
    module:"PLACEMENTS",eventType:"placements.hr_slot.book",
    subjectType:"interview_slot",subjectId:slot.id,
    summary:"Recruiter updated internal interview slot",metadata:{jobId:job.id,action:input.action},
   });
  }
  return {id:updated.id,status:next,version:updated.version,
   startAt:slot.startAt.toISOString(),endAt:slot.endAt.toISOString()};
 });
}
