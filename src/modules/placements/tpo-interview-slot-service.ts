import "server-only";
import {and,eq,ne,asc,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,learnerProfiles,placementApplications,
 placementApplicationScreenings,placementJobRounds,placementJobs,users} from "@/db/schema";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {placementTableExists} from "./staged-tables";
import {requireTpoJobCollege,requireTpoJobActor,type TpoJobTx} from "./tpo-job-write-base";
import {placementJobIdSchema,placementRoundIdSchema} from "./validation";
import {planInterviewDay,tpoInterviewSlotActionSchema} from "./tpo-interview-slot-model";

async function scope(context:RequestContext,rawJobId:unknown,rawRoundId:unknown){
 const collegeId=await requireTpoJobCollege(context);
 const jobId=placementJobIdSchema.parse(rawJobId),roundId=placementRoundIdSchema.parse(rawRoundId);
 const [round]=await getDb().select({
  id:placementJobRounds.id,jobId:placementJobs.id,jobTitle:placementJobs.title,
  name:placementJobRounds.name,kind:placementJobRounds.kind,roundStatus:placementJobRounds.status,
  jobStatus:placementJobs.status,
 }).from(placementJobRounds).innerJoin(placementJobs,eq(placementJobs.id,placementJobRounds.jobId))
 .where(and(eq(placementJobs.collegeId,collegeId),eq(placementJobs.id,jobId),
  eq(placementJobRounds.id,roundId))).limit(1);
 if(!round)throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
 return {round,collegeId};
}
export async function getTpoInterviewSlotWorkspace(context:RequestContext,jobId:unknown,roundId:unknown){
 const info=await scope(context,jobId,roundId);
 const storageReady=await placementTableExists("placement_round_candidate_slots");
 const roster=await getDb().select({
  applicationId:placementApplications.id,
  name:users.displayName,roll:learnerProfiles.rollNumber,
  email:users.email,
 }).from(placementApplications)
 .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
  eq(collegeMemberships.collegeId,info.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
 .where(and(eq(placementApplications.jobId,info.round.jobId),
  eq(placementApplications.status,"SUBMITTED"),
  eq(placementApplicationScreenings.status,"SHORTLISTED")))
 .orderBy(asc(learnerProfiles.rollNumber),asc(users.displayName));
 const slots=storageReady?await getDb().select().from(placementRoundCandidateSlots)
  .where(and(eq(placementRoundCandidateSlots.roundId,info.round.id),
   ne(placementRoundCandidateSlots.status,"CANCELLED")))
  .orderBy(asc(placementRoundCandidateSlots.startsAt),asc(placementRoundCandidateSlots.room)):[];
 const booked=new Set(slots.map(s=>s.applicationId).filter(Boolean));
 return {...info,storageReady,roster,unassigned:roster.filter(r=>!booked.has(r.applicationId)),
  slots:slots.map(row=>({...row,startsAt:row.startsAt.toISOString(),endsAt:row.endsAt.toISOString(),
   createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString(),
   confirmedAt:row.confirmedAt?.toISOString()??null}))};
}
async function notice(tx:TpoJobTx,context:RequestContext,job:{id:string;title:string},applicationId:string,
 action:string,message:string){
 const [learner]=await tx.select({userId:collegeMemberships.userId})
  .from(placementApplications).innerJoin(collegeMemberships,
   eq(collegeMemberships.id,placementApplications.membershipId))
  .where(and(eq(placementApplications.id,applicationId),eq(placementApplications.jobId,job.id),
   eq(collegeMemberships.collegeId,context.membership!.collegeId))).limit(1);
 if(!learner)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
 const [event]=await tx.insert(activityEvents).values({
  organizationId:context.membership!.organizationId,collegeId:context.membership!.collegeId,
  actorUserId:context.user.id,actorMembershipId:context.membership!.id,
  module:"PLACEMENTS",eventType:action,subjectType:"placement_application",
  subjectId:applicationId,summary:message,metadata:{jobId:job.id},
 }).returning({id:activityEvents.id});
 if(!event)throw Error("Interview slot audit failed");
 await tx.insert(inAppNotifications).values({
  userId:learner.userId,eventId:event.id,title:"Your interview schedule has changed",
  body:message,actionHref:"/learn/my-placements/interviews",
 }).onConflictDoNothing();
}
export async function mutateTpoInterviewSlots(context:RequestContext,rawJobId:unknown,rawRoundId:unknown,raw:unknown){
 const info=await scope(context,rawJobId,rawRoundId);
 if(!await placementTableExists("placement_round_candidate_slots"))
  throw Error("Interview slot storage has not been registered yet.");
 const input=tpoInterviewSlotActionSchema.parse(raw);
 if(info.round.jobStatus!=="PUBLISHED"||info.round.kind!=="INTERVIEW"||
  info.round.roundStatus!=="SCHEDULED")throw new PlacementsServiceError("PLACEMENT_ROUND_JOB_READ_ONLY");
 return getDb().transaction(async tx=>{
  await requireTpoJobActor(tx,context);
  const [current]=await tx.select({status:placementJobRounds.status})
   .from(placementJobRounds).where(eq(placementJobRounds.id,info.round.id))
   .for("update").limit(1);
  if(current?.status!=="SCHEDULED")throw new PlacementsServiceError("PLACEMENT_ROUND_INVALID_TRANSITION");
  const job={id:info.round.jobId,title:info.round.jobTitle};
  if(input.action==="GENERATE_DAY"){
   const proposed=planInterviewDay(input);
   if(proposed.length>300)throw Error("Create up to 300 interview slots at a time.");
   if(proposed.some(p=>p.startsAt.getTime()<=Date.now()))throw Error("New interview slots must be in the future.");
   const existing=await tx.select().from(placementRoundCandidateSlots).where(and(
    eq(placementRoundCandidateSlots.roundId,info.round.id),ne(placementRoundCandidateSlots.status,"CANCELLED")));
   if(proposed.some(p=>existing.some(e=>e.room.toLowerCase()===p.room.toLowerCase()&&
    e.startsAt<p.endsAt&&e.endsAt>p.startsAt)))throw Error("These times overlap an existing room booking.");
   const saved=await tx.insert(placementRoundCandidateSlots).values(proposed.map(p=>({
    jobId:job.id,roundId:info.round.id,room:p.room,startsAt:p.startsAt,endsAt:p.endsAt,
    applicationId:null,status:"AVAILABLE",changedByUserId:context.user.id,
   }))).returning({id:placementRoundCandidateSlots.id});
   return {created:saved.length};
  }
  if(input.action==="CLEAR_AVAILABLE"){
   const cleared=await tx.update(placementRoundCandidateSlots).set({
    status:"CANCELLED",updatedAt:new Date(),version:sql`${placementRoundCandidateSlots.version}+1`,
   }).where(and(eq(placementRoundCandidateSlots.roundId,info.round.id),
    eq(placementRoundCandidateSlots.status,"AVAILABLE")))
    .returning({id:placementRoundCandidateSlots.id});
   return {cleared:cleared.length};
  }
  const id=input.slotId;
  const [slot]=await tx.select().from(placementRoundCandidateSlots).where(and(
   eq(placementRoundCandidateSlots.id,id),eq(placementRoundCandidateSlots.roundId,info.round.id)))
   .for("update").limit(1);
  if(!slot||slot.version!==input.expectedVersion||slot.status==="CANCELLED")
   throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
  if(input.action==="ASSIGN_ROOM"){
   const collisions=await tx.select({id:placementRoundCandidateSlots.id})
    .from(placementRoundCandidateSlots).where(and(
     eq(placementRoundCandidateSlots.roundId,info.round.id),
     ne(placementRoundCandidateSlots.id,slot.id),
     ne(placementRoundCandidateSlots.status,"CANCELLED"),
     sql`lower(${placementRoundCandidateSlots.room}) = lower(${input.room})`,
     sql`${placementRoundCandidateSlots.startsAt} < ${slot.endsAt}`,
     sql`${placementRoundCandidateSlots.endsAt} > ${slot.startsAt}`)).limit(1);
   if(collisions.length)throw Error("That room is already in use at this time.");
   await tx.update(placementRoundCandidateSlots).set({
    room:input.room,updatedAt:new Date(),version:slot.version+1,
   }).where(eq(placementRoundCandidateSlots.id,id));
   return {changed:1};
  }
  if(input.action==="BOOK"){
   if(slot.status!=="AVAILABLE")throw Error("The slot is no longer available.");
   const [candidate]=await tx.select({id:placementApplications.id})
    .from(placementApplications).innerJoin(placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId,placementApplications.id))
    .where(and(eq(placementApplications.id,input.applicationId),
     eq(placementApplications.jobId,job.id),eq(placementApplications.status,"SUBMITTED"),
     eq(placementApplicationScreenings.status,"SHORTLISTED"))).limit(1);
   if(!candidate)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
   const [saved]=await tx.update(placementRoundCandidateSlots).set({
    applicationId:input.applicationId,status:"BOOKED",
    confirmedAt:new Date(),updatedAt:new Date(),version:slot.version+1,
   }).where(and(eq(placementRoundCandidateSlots.id,id),
    eq(placementRoundCandidateSlots.status,"AVAILABLE")))
    .returning({id:placementRoundCandidateSlots.id});
   if(!saved)throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
   await notice(tx,context,job,input.applicationId,"PLACEMENTS_TPO_INTERVIEW_BOOKED",
    "Your interview for "+job.title+" is booked for "+slot.startsAt.toISOString()+" ("+slot.room+").");
   return {booked:1};
  }
  if(input.action==="CANCEL"){
   await tx.update(placementRoundCandidateSlots).set({
    applicationId:null,status:"CANCELLED",updatedAt:new Date(),version:slot.version+1,
   }).where(eq(placementRoundCandidateSlots.id,id));
   if(slot.applicationId)await notice(tx,context,job,slot.applicationId,"PLACEMENTS_TPO_INTERVIEW_CANCELLED",
    "Your interview slot was cancelled. Reason: "+input.reason);
   return {cancelled:1};
  }
  if(input.action==="MOVE"){
   if(!slot.applicationId||slot.status!=="BOOKED"||input.slotId===input.targetSlotId)
    throw Error("Choose an assigned interview and a different free slot.");
   const [target]=await tx.select().from(placementRoundCandidateSlots).where(and(
    eq(placementRoundCandidateSlots.id,input.targetSlotId),
    eq(placementRoundCandidateSlots.roundId,info.round.id))).for("update").limit(1);
   if(!target||target.status!=="AVAILABLE")throw Error("Destination is not free.");
   await tx.update(placementRoundCandidateSlots).set({
    status:"CANCELLED",applicationId:null,updatedAt:new Date(),version:slot.version+1,
   }).where(eq(placementRoundCandidateSlots.id,slot.id));
   await tx.update(placementRoundCandidateSlots).set({
    status:"BOOKED",applicationId:slot.applicationId,confirmedAt:new Date(),
    updatedAt:new Date(),version:target.version+1,
   }).where(eq(placementRoundCandidateSlots.id,target.id));
   await notice(tx,context,job,slot.applicationId,"PLACEMENTS_TPO_INTERVIEW_MOVED",
    "Your interview for "+job.title+" was moved to "+target.startsAt.toISOString()+" ("+target.room+"). "+input.reason);
   return {moved:1};
  }
  throw Error("Unsupported slot action");
 });
}
