import "server-only";
import {and,eq,ne,asc,desc,sql,gt,lt} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,learnerProfiles,placementApplications,
 placementApplicationScreenings,placementApplicationRoundExceptions,placementLearnerRequests,placementJobRounds,placementJobs,users} from "@/db/schema";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import {hrInterviewSlots} from "@/db/schema/placement-hr-interview-slots";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {placementTableExists} from "./staged-tables";
import {requireTpoJobCollege,requireTpoJobActor,type TpoJobTx} from "./tpo-job-write-base";
import {placementJobIdSchema,placementRoundIdSchema} from "./validation";
import {overlapsInterviewRoom,planInterviewDay,sameInterviewRoom,tpoInterviewSlotActionSchema} from "./tpo-interview-slot-model";
import {actOnPlacementRequest} from "./request-service";

/** Legacy /api/v1/interviews endpoint operations mapped to canonical vNext
 * job/round/slot facts. Not all legacy actions belong to the same writer. */
export const LEGACY_INTERVIEW_SLOT_ACTIONS = {
  LIST: "getTpoInterviewSlotWorkspace",
  CREATE: "mutateTpoInterviewSlots.BOOK",
  UPDATE: "mutateTpoInterviewSlots.MOVE",
  CANCEL: "mutateTpoInterviewSlots.CANCEL",
  CONFIRM: "learner-round-confirmation-service",
  RESCHEDULE: "placement_learner_requests.ROUND_RESCHEDULE",
  COMPLETE: "college-interview-action-service",
  FEEDBACK: "college-interview-action-service",
} as const;


async function scope(context:RequestContext,rawJobId:unknown,rawRoundId:unknown){
 const collegeId=await requireTpoJobCollege(context);
 const jobId=placementJobIdSchema.parse(rawJobId),roundId=placementRoundIdSchema.parse(rawRoundId);
 const [round]=await getDb().select({
  id:placementJobRounds.id,jobId:placementJobs.id,jobTitle:placementJobs.title,
  name:placementJobRounds.name,kind:placementJobRounds.kind,mode:placementJobRounds.mode,
  meetingUrl:placementJobRounds.meetingUrl,roundStatus:placementJobRounds.status,
  jobStatus:placementJobs.status,
 }).from(placementJobRounds).innerJoin(placementJobs,eq(placementJobs.id,placementJobRounds.jobId))
 .where(and(eq(placementJobs.collegeId,collegeId),eq(placementJobs.id,jobId),
  eq(placementJobRounds.id,roundId))).limit(1);
 if(!round)throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
 return {round,collegeId};
}
export async function getTpoInterviewSlotWorkspace(context:RequestContext,jobId:unknown,roundId:unknown){
 const info=await scope(context,jobId,roundId);
 const storageReady=true; // registered in 0116
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
  eq(placementApplicationScreenings.status,"SHORTLISTED"),
  eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
 .orderBy(asc(learnerProfiles.rollNumber),asc(users.displayName));
 const slots=storageReady?await getDb().select().from(placementRoundCandidateSlots)
  .where(and(eq(placementRoundCandidateSlots.roundId,info.round.id),
   ne(placementRoundCandidateSlots.status,"CANCELLED")))
  .orderBy(asc(placementRoundCandidateSlots.startsAt),asc(placementRoundCandidateSlots.room)):[];
 const recruiterProposals=await placementTableExists("placement_hr_interview_slots")?
  await getDb().select({
   id:hrInterviewSlots.id,startsAt:hrInterviewSlots.startAt,endsAt:hrInterviewSlots.endAt,
   mode:hrInterviewSlots.mode,meetingLocation:hrInterviewSlots.meetingLocation,
   panelLabel:hrInterviewSlots.panelLabel,version:hrInterviewSlots.version,
  }).from(hrInterviewSlots).where(and(
   eq(hrInterviewSlots.collegeId,info.collegeId),
   eq(hrInterviewSlots.roundId,info.round.id),eq(hrInterviewSlots.status,"PROPOSED"))):[];
 const reschedules=await getDb().select({
  id:placementLearnerRequests.id,applicationId:placementLearnerRequests.applicationId,
  reason:placementLearnerRequests.reason,requestedAt:placementLearnerRequests.requestedAt,
  name:users.displayName,
 }).from(placementLearnerRequests)
  .innerJoin(placementApplications,eq(placementApplications.id,placementLearnerRequests.applicationId))
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,info.collegeId)))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(eq(placementLearnerRequests.roundId,info.round.id),
   eq(placementApplications.jobId,info.round.jobId),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
   eq(placementLearnerRequests.requestType,"ROUND_RESCHEDULE"),
   eq(placementLearnerRequests.status,"PENDING")));
 const booked=new Set(slots.map(s=>s.applicationId).filter(Boolean));
 // An officer may be revoked while the roster and slot reads are in flight.
 // Fail closed before returning candidate names and work email addresses.
 await getDb().transaction(async tx=>{await requireTpoJobActor(tx,context);});
 const now=new Date();
 return {...info,storageReady,roster,unassigned:roster.filter(r=>!booked.has(r.applicationId)),
  upcomingSlotCount:slots.filter(slot=>slot.startsAt>=now).length,
  pastSlotCount:slots.filter(slot=>slot.startsAt<now).length,
  pendingRescheduleCount:reschedules.length,
  // A pending change request does not cancel the existing confirmed slot.
  upcomingApplicationIds:slots.filter(slot=>slot.status==="BOOKED"&&slot.startsAt>=now)
   .map(slot=>slot.applicationId).filter((id):id is string=>Boolean(id)),
  pendingRescheduleApplicationIds:reschedules.map(row=>row.applicationId),
  pastApplicationIds:slots.filter(slot=>slot.status==="BOOKED"&&slot.startsAt<now)
   .map(slot=>slot.applicationId).filter((id):id is string=>Boolean(id)),
  recruiterProposals:recruiterProposals.map(row=>({...row,startsAt:row.startsAt.toISOString(),endsAt:row.endsAt.toISOString()})),
  reschedules:reschedules.map(row=>({...row,requestedAt:row.requestedAt.toISOString()})),
  slots:slots.map(row=>({...row,startsAt:row.startsAt.toISOString(),endsAt:row.endsAt.toISOString(),
   createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString(),
   confirmedAt:row.confirmedAt?.toISOString()??null}))};
}
/** Booking in distinct placement rounds must serialize on the learner
 * membership before checking overlapping time windows. */
async function assertLearnerTimeAvailable(tx:TpoJobTx,collegeId:string,
 applicationId:string,startsAt:Date,endsAt:Date,ignoreSlotId?:string){
 const [application]=await tx.select({
   membershipId:placementApplications.membershipId,userId:collegeMemberships.userId,
  }).from(placementApplications)
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .where(and(eq(placementApplications.id,applicationId),
   eq(placementJobs.collegeId,collegeId),
   eq(collegeMemberships.collegeId,collegeId))).limit(1);
 if(!application)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
 const [membership]=await tx.select({id:collegeMemberships.id})
  .from(collegeMemberships).where(and(
   eq(collegeMemberships.id,application.membershipId),
   eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE"))).for("update").limit(1);
 if(!membership)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
 // Lock the person as well as their college membership. The same learner
 // can have multiple memberships in one organization; checking one UUID
 // alone would permit simultaneous interviews in different colleges.
 const [lockedUser]=await tx.select({id:users.id}).from(users)
  .where(eq(users.id,application.userId)).for("update").limit(1);
 if(!lockedUser)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
 const [conflict]=await tx.select({id:placementRoundCandidateSlots.id})
  .from(placementRoundCandidateSlots)
  .innerJoin(placementApplications,
   eq(placementApplications.id,placementRoundCandidateSlots.applicationId))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .where(and(
   eq(collegeMemberships.userId,application.userId),
   eq(placementRoundCandidateSlots.status,"BOOKED"),
   ignoreSlotId?ne(placementRoundCandidateSlots.id,ignoreSlotId):undefined,
   lt(placementRoundCandidateSlots.startsAt,endsAt),
   gt(placementRoundCandidateSlots.endsAt,startsAt),
  )).limit(1);
 if(conflict)throw Error("This learner already has an interview at that time. "+
  "Choose another slot; the existing booking has been preserved.");
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
 const input=tpoInterviewSlotActionSchema.parse(raw);
 if(input.action==="KEEP_REQUEST"){
  const [inScope]=await getDb().select({id:placementLearnerRequests.id})
   .from(placementLearnerRequests)
   .innerJoin(placementApplications,eq(placementApplications.id,placementLearnerRequests.applicationId))
   .where(and(eq(placementLearnerRequests.id,input.requestId),
    eq(placementLearnerRequests.roundId,info.round.id),
    eq(placementApplications.jobId,info.round.jobId),
    eq(placementLearnerRequests.requestType,"ROUND_RESCHEDULE"),
    eq(placementLearnerRequests.status,"PENDING"))).limit(1);
  if(!inScope)throw new PlacementsServiceError("PLACEMENT_REQUEST_NOT_FOUND");
  const result=await actOnPlacementRequest(context,input.requestId,{
   action:"REJECT",note:"Keep existing interview slot. "+input.reason,
  });
  return {kept:1,requestId:result.id};
 }
 if(info.round.jobStatus!=="PUBLISHED"||info.round.kind!=="INTERVIEW"||
  info.round.roundStatus!=="SCHEDULED")throw new PlacementsServiceError("PLACEMENT_ROUND_JOB_READ_ONLY");
 // Legacy allowed booking only against an active interview. The explicit
 // round and drive states are the vNext equivalent, not a generic event.
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
   if(proposed.some(p=>overlapsInterviewRoom(p,existing)))throw Error("These times overlap an existing room booking.");
   const saved=await tx.insert(placementRoundCandidateSlots).values(proposed.map(p=>({
    jobId:job.id,roundId:info.round.id,room:p.room,startsAt:p.startsAt,endsAt:p.endsAt,
    applicationId:null,status:"AVAILABLE",changedByUserId:context.user.id,
   }))).returning({id:placementRoundCandidateSlots.id});
   if(saved.length)await tx.insert(activityEvents).values({
    organizationId:context.membership!.organizationId,collegeId:info.collegeId,
    actorUserId:context.user.id,actorMembershipId:context.membership!.id,
    module:"PLACEMENTS",eventType:"PLACEMENTS_TPO_INTERVIEW_SLOTS_GENERATED",
    subjectType:"placement_round",subjectId:info.round.id,
    summary:"TPO generated "+saved.length+" interview slots for "+job.title,
    metadata:{created:saved.length,rooms:proposed.map(slot=>slot.room).filter((room,index,list)=>list.indexOf(room)===index)},
   });
   return {created:saved.length};
  }
  if(input.action==="CLEAR_AVAILABLE"){
   const cleared=await tx.update(placementRoundCandidateSlots).set({
    status:"CANCELLED",updatedAt:new Date(),version:sql`${placementRoundCandidateSlots.version}+1`,
   }).where(and(eq(placementRoundCandidateSlots.roundId,info.round.id),
    eq(placementRoundCandidateSlots.status,"AVAILABLE")))
    .returning({id:placementRoundCandidateSlots.id});
   if(cleared.length)await tx.insert(activityEvents).values({
    organizationId:context.membership!.organizationId,collegeId:info.collegeId,
    actorUserId:context.user.id,actorMembershipId:context.membership!.id,
    module:"PLACEMENTS",eventType:"PLACEMENTS_TPO_INTERVIEW_AVAILABLE_CLEARED",
    subjectType:"placement_round",subjectId:info.round.id,
    summary:"TPO cleared "+cleared.length+" available interview slots for "+job.title,
    metadata:{cleared:cleared.length},
   });
   return {cleared:cleared.length};
  }
  if(input.action==="CONFIRM_RECRUITER_PROPOSAL"){
   if(!await placementTableExists("placement_hr_interview_slots"))throw Error("Recruiter slots are not registered.");
   const [proposal]=await tx.select().from(hrInterviewSlots).where(and(
    eq(hrInterviewSlots.id,input.proposalId),eq(hrInterviewSlots.collegeId,info.collegeId),
    eq(hrInterviewSlots.roundId,info.round.id))).for("update").limit(1);
   if(!proposal||proposal.version!==input.expectedVersion||proposal.status!=="PROPOSED")
    throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
   const [saved]=await tx.update(hrInterviewSlots).set({
    status:"OFFERED",meetingLocation:input.venue,version:proposal.version+1,updatedAt:new Date(),
   }).where(and(eq(hrInterviewSlots.id,proposal.id),eq(hrInterviewSlots.status,"PROPOSED")))
    .returning({id:hrInterviewSlots.id});
   if(!saved)throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
   await tx.insert(activityEvents).values({
    organizationId:context.membership!.organizationId,collegeId:info.collegeId,
    actorUserId:context.user.id,actorMembershipId:context.membership!.id,
    module:"PLACEMENTS",eventType:"PLACEMENTS_TPO_RECRUITER_SLOT_CONFIRMED",
    subjectType:"placement_round",subjectId:info.round.id,
    summary:"TPO confirmed recruiter interview slot",metadata:{proposalId:proposal.id,venue:input.venue},
   });
   return {confirmed:1};
  }
  if(input.action==="ASSIGN_ROOMS_BY_ROLL"){
   const collator=new Intl.Collator("en",{numeric:true,sensitivity:"base"});
   if(collator.compare(input.fromRoll,input.toRoll)>0)throw Error("Invalid roll range.");
   const rows=await tx.select({slot:placementRoundCandidateSlots,roll:learnerProfiles.rollNumber})
    .from(placementRoundCandidateSlots)
    .innerJoin(placementApplications,and(
     eq(placementApplications.id,placementRoundCandidateSlots.applicationId),
     eq(placementApplications.jobId,job.id),
     eq(placementApplications.status,"SUBMITTED")))
    .innerJoin(collegeMemberships,and(
     eq(collegeMemberships.id,placementApplications.membershipId),
     eq(collegeMemberships.collegeId,info.collegeId),
     eq(collegeMemberships.status,"ACTIVE")))
    .innerJoin(users,and(
     eq(users.id,collegeMemberships.userId),
     eq(users.platformStatus,"ACTIVE")))
    .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,placementApplications.membershipId))
    .where(and(eq(placementRoundCandidateSlots.roundId,info.round.id),
     eq(placementRoundCandidateSlots.status,"BOOKED")));
   const eligible=rows.filter(r=>r.roll!==null&&
    collator.compare(r.roll,input.fromRoll)>=0&&collator.compare(r.roll,input.toRoll)<=0);
   const all=await tx.select().from(placementRoundCandidateSlots).where(and(
    eq(placementRoundCandidateSlots.roundId,info.round.id),
    ne(placementRoundCandidateSlots.status,"CANCELLED")));
   let changed=0;const skipped:Array<{applicationId:string;reason:string}>=[];
   for(const item of eligible){
    const slot=item.slot;
    if(sameInterviewRoom(slot.room,input.room))continue;
    const conflict=overlapsInterviewRoom({...slot,room:input.room},all.filter(other=>
     other.id!==slot.id&&other.status!=="CANCELLED"));
    if(conflict){
     skipped.push({applicationId:slot.applicationId!,reason:"Room already has an overlapping slot"});continue;
    }
    // A concurrent slot cancellation, move or previous room edit must not
    // silently overwrite a stale bulk assignment and notify the wrong learner.
    // Abort the whole transaction on a lost compare-and-swap.
    const [saved]=await tx.update(placementRoundCandidateSlots).set({
     room:input.room,version:slot.version+1,updatedAt:new Date(),
    }).where(and(
     eq(placementRoundCandidateSlots.id,slot.id),
     eq(placementRoundCandidateSlots.roundId,info.round.id),
     eq(placementRoundCandidateSlots.status,"BOOKED"),
     eq(placementRoundCandidateSlots.applicationId,slot.applicationId!),
     eq(placementRoundCandidateSlots.version,slot.version),
    )).returning({id:placementRoundCandidateSlots.id});
    if(!saved)throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
    // Existing individual overrides must track a bulk physical-room change.
    if(info.round.mode!=="VIRTUAL")await tx.update(placementApplicationRoundExceptions).set({
     venue:input.room,updatedAt:new Date(),
    }).where(and(eq(placementApplicationRoundExceptions.applicationId,slot.applicationId!),
     eq(placementApplicationRoundExceptions.roundId,info.round.id)));
    await notice(tx,context,job,slot.applicationId!,"PLACEMENTS_TPO_INTERVIEW_ROOM_CHANGED",
     "Your interview room for "+job.title+" is now "+input.room+".");
    slot.room=input.room;
    const tracked=all.find(existing=>existing.id===slot.id);
    if(tracked)tracked.room=input.room;
    changed++;
   }
   return {changed,skipped,eligible:eligible.length};
  }
  if(input.action==="MOVE_REQUEST"){
   const [request]=await tx.select().from(placementLearnerRequests).where(and(
    eq(placementLearnerRequests.id,input.requestId),
    eq(placementLearnerRequests.roundId,info.round.id),
    eq(placementLearnerRequests.requestType,"ROUND_RESCHEDULE"),
    eq(placementLearnerRequests.status,"PENDING"))).for("update").limit(1);
   if(!request)throw new PlacementsServiceError("PLACEMENT_REQUEST_INVALID_STATE");
   const [application]=await tx.select({id:placementApplications.id})
    .from(placementApplications)
    .innerJoin(placementApplicationScreenings,
     eq(placementApplicationScreenings.applicationId,placementApplications.id))
    .innerJoin(collegeMemberships,and(
     eq(collegeMemberships.id,placementApplications.membershipId),
     eq(collegeMemberships.collegeId,info.collegeId),
     eq(collegeMemberships.status,"ACTIVE")))
    .innerJoin(users,and(
     eq(users.id,collegeMemberships.userId),
     eq(users.platformStatus,"ACTIVE")))
    .where(and(
     eq(placementApplications.id,request.applicationId),
     eq(placementApplications.jobId,job.id),eq(placementApplications.status,"SUBMITTED"),
     eq(placementApplicationScreenings.status,"SHORTLISTED"))).limit(1);
   if(!application)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
   const [withdrawal]=await tx.select({id:placementLearnerRequests.id})
    .from(placementLearnerRequests).where(and(
     eq(placementLearnerRequests.applicationId,request.applicationId),
     eq(placementLearnerRequests.requestType,"APPLICATION_WITHDRAWAL"),
     eq(placementLearnerRequests.status,"PENDING"))).limit(1);
   if(withdrawal)throw Error("Resolve the pending withdrawal before approving another interview time.");
   const [target]=await tx.select().from(placementRoundCandidateSlots).where(and(
    eq(placementRoundCandidateSlots.id,input.targetSlotId),
    eq(placementRoundCandidateSlots.roundId,info.round.id))).for("update").limit(1);
   if(!target||target.status!=="AVAILABLE"||target.startsAt<=new Date())
    throw Error("The requested new interview slot is no longer available.");
   const [existing]=await tx.select().from(placementRoundCandidateSlots).where(and(
    eq(placementRoundCandidateSlots.roundId,info.round.id),
    eq(placementRoundCandidateSlots.applicationId,request.applicationId),
    eq(placementRoundCandidateSlots.status,"BOOKED"))).for("update").limit(1);
   await assertLearnerTimeAvailable(tx,info.collegeId,
    request.applicationId,target.startsAt,target.endsAt,existing?.id);
   if(existing)await tx.update(placementRoundCandidateSlots).set({
    applicationId:null,status:"CANCELLED",updatedAt:new Date(),version:existing.version+1,
   }).where(eq(placementRoundCandidateSlots.id,existing.id));
   const [booked]=await tx.update(placementRoundCandidateSlots).set({
    applicationId:request.applicationId,status:"BOOKED",updatedAt:new Date(),
    confirmedAt:new Date(),version:target.version+1,
   }).where(eq(placementRoundCandidateSlots.id,target.id)).returning({id:placementRoundCandidateSlots.id});
   if(!booked)throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
   await tx.insert(placementApplicationRoundExceptions).values({
    applicationId:request.applicationId,roundId:info.round.id,requestId:request.id,
    scheduledAt:target.startsAt,timezone:"Asia/Kolkata",
    mode:info.round.mode==="VIRTUAL"?"VIRTUAL":"ON_CAMPUS",
    venue:info.round.mode==="VIRTUAL"?null:target.room,
    meetingUrl:info.round.mode==="VIRTUAL"?info.round.meetingUrl:null,
   }).onConflictDoUpdate({
    target:[placementApplicationRoundExceptions.applicationId,placementApplicationRoundExceptions.roundId],
    set:{requestId:request.id,scheduledAt:target.startsAt,timezone:"Asia/Kolkata",
     mode:info.round.mode==="VIRTUAL"?"VIRTUAL":"ON_CAMPUS",
     venue:info.round.mode==="VIRTUAL"?null:target.room,
     meetingUrl:info.round.mode==="VIRTUAL"?info.round.meetingUrl:null,updatedAt:new Date()},
   });
   const [decided]=await tx.update(placementLearnerRequests).set({
    status:"APPROVED",decidedByUserId:context.user.id,decidedAt:new Date(),
    decisionNote:input.reason,updatedAt:new Date(),
   }).where(and(eq(placementLearnerRequests.id,request.id),
    eq(placementLearnerRequests.status,"PENDING"))).returning({id:placementLearnerRequests.id});
   if(!decided)throw new PlacementsServiceError("PLACEMENT_REQUEST_INVALID_STATE");
   await notice(tx,context,job,request.applicationId,"PLACEMENTS_TPO_INTERVIEW_RESCHEDULE_APPROVED",
    "Your interview reschedule was approved. New slot: "+target.startsAt.toISOString()+
    " ("+target.room+"). "+input.reason);
   return {moved:1,requestId:request.id};
  }
  const id=input.slotId;
  const [slot]=await tx.select().from(placementRoundCandidateSlots).where(and(
   eq(placementRoundCandidateSlots.id,id),eq(placementRoundCandidateSlots.roundId,info.round.id)))
   .for("update").limit(1);
  if(!slot||slot.version!==input.expectedVersion||slot.status==="CANCELLED")
   throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
  if(input.action==="ASSIGN_ROOM"){
   // An unchanged room is not a new edit: no version bump and no duplicate notice.
   if(sameInterviewRoom(slot.room,input.room))
    return {changed:0};
   // Match the same NFKC/trim/case-folded room semantics as the day
   // planner and bulk-room editor. SQL lower(trim()) alone misses e.g.
   // full-width names and canonically equivalent Unicode spellings.
   const collisions=await tx.select({
    room:placementRoundCandidateSlots.room,
    startsAt:placementRoundCandidateSlots.startsAt,endsAt:placementRoundCandidateSlots.endsAt,
   }).from(placementRoundCandidateSlots).where(and(
    eq(placementRoundCandidateSlots.roundId,info.round.id),
    ne(placementRoundCandidateSlots.id,slot.id),
    ne(placementRoundCandidateSlots.status,"CANCELLED"),
    lt(placementRoundCandidateSlots.startsAt,slot.endsAt),
    gt(placementRoundCandidateSlots.endsAt,slot.startsAt))).limit(1001);
   if(collisions.length>1000||overlapsInterviewRoom({...slot,room:input.room},collisions))
    throw Error("That room is already in use at this time.");
   await tx.update(placementRoundCandidateSlots).set({
    room:input.room,updatedAt:new Date(),version:slot.version+1,
   }).where(eq(placementRoundCandidateSlots.id,id));
   if(slot.applicationId&&slot.status==="BOOKED"&&info.round.mode!=="VIRTUAL")
    await tx.update(placementApplicationRoundExceptions).set({
     venue:input.room,updatedAt:new Date(),
    }).where(and(eq(placementApplicationRoundExceptions.applicationId,slot.applicationId),
     eq(placementApplicationRoundExceptions.roundId,info.round.id)));
   if(slot.applicationId&&slot.status==="BOOKED")await notice(tx,context,job,slot.applicationId,
    "PLACEMENTS_TPO_INTERVIEW_ROOM_CHANGED","Your interview for "+job.title+" has moved to room "+input.room+".");
   else await tx.insert(activityEvents).values({
    organizationId:context.membership!.organizationId,collegeId:info.collegeId,
    actorUserId:context.user.id,actorMembershipId:context.membership!.id,
    module:"PLACEMENTS",eventType:"PLACEMENTS_TPO_INTERVIEW_ROOM_CHANGED",
    subjectType:"placement_round",subjectId:info.round.id,
    summary:"TPO changed an available interview slot room for "+job.title,
    metadata:{slotId:slot.id,room:input.room},
   });
   return {changed:1};
  }
  if(input.action==="BOOK"){
   if(slot.status!=="AVAILABLE"||slot.startsAt<=new Date())
    throw Error("Only a future available interview slot can be booked.");
   const [candidate]=await tx.select({id:placementApplications.id})
    .from(placementApplications).innerJoin(placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId,placementApplications.id))
    .innerJoin(collegeMemberships,and(
     eq(collegeMemberships.id,placementApplications.membershipId),
     eq(collegeMemberships.collegeId,info.collegeId),
     eq(collegeMemberships.status,"ACTIVE")))
    .innerJoin(users,and(
     eq(users.id,collegeMemberships.userId),
     eq(users.platformStatus,"ACTIVE")))
    .where(and(eq(placementApplications.id,input.applicationId),
     eq(placementApplications.jobId,job.id),eq(placementApplications.status,"SUBMITTED"),
     eq(placementApplicationScreenings.status,"SHORTLISTED"))).limit(1);
   if(!candidate)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
   const [alreadyBooked]=await tx.select({id:placementRoundCandidateSlots.id})
    .from(placementRoundCandidateSlots).where(and(
     eq(placementRoundCandidateSlots.applicationId,input.applicationId),
     eq(placementRoundCandidateSlots.roundId,info.round.id),
     eq(placementRoundCandidateSlots.status,"BOOKED"))).limit(1);
   if(alreadyBooked)throw Error("This learner already has a booked interview in this round. Use Move to reschedule.");
   const [pendingWithdrawal]=await tx.select({id:placementLearnerRequests.id})
    .from(placementLearnerRequests).where(and(
     eq(placementLearnerRequests.applicationId,input.applicationId),
     eq(placementLearnerRequests.requestType,"APPLICATION_WITHDRAWAL"),
     eq(placementLearnerRequests.status,"PENDING"))).limit(1);
   if(pendingWithdrawal)throw Error("Resolve the learner's pending withdrawal before assigning a new interview.");
   await assertLearnerTimeAvailable(tx,info.collegeId,
    input.applicationId,slot.startsAt,slot.endsAt);
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
   if(slot.applicationId)await tx.delete(placementApplicationRoundExceptions).where(and(
    eq(placementApplicationRoundExceptions.applicationId,slot.applicationId),
    eq(placementApplicationRoundExceptions.roundId,info.round.id)));
   if(slot.applicationId)await notice(tx,context,job,slot.applicationId,"PLACEMENTS_TPO_INTERVIEW_CANCELLED",
    "Your interview slot was cancelled. Reason: "+input.reason);
   else await tx.insert(activityEvents).values({
    organizationId:context.membership!.organizationId,collegeId:info.collegeId,
    actorUserId:context.user.id,actorMembershipId:context.membership!.id,
    module:"PLACEMENTS",eventType:"PLACEMENTS_TPO_INTERVIEW_CANCELLED",
    subjectType:"placement_round",subjectId:info.round.id,
    summary:"TPO cancelled an unassigned interview slot for "+job.title,
    metadata:{slotId:slot.id,reason:input.reason},
   });
   return {cancelled:1};
  }
  if(input.action==="MOVE"){
   if(!slot.applicationId||slot.status!=="BOOKED"||input.slotId===input.targetSlotId)
    throw Error("Choose an assigned interview and a different free slot.");
   const [target]=await tx.select().from(placementRoundCandidateSlots).where(and(
    eq(placementRoundCandidateSlots.id,input.targetSlotId),
    eq(placementRoundCandidateSlots.roundId,info.round.id))).for("update").limit(1);
   if(!target||target.status!=="AVAILABLE"||target.startsAt<=new Date())
    throw Error("The destination must be a future available interview slot.");
   await assertLearnerTimeAvailable(tx,info.collegeId,
    slot.applicationId,target.startsAt,target.endsAt,slot.id);
   await tx.update(placementRoundCandidateSlots).set({
    status:"CANCELLED",applicationId:null,updatedAt:new Date(),version:slot.version+1,
   }).where(eq(placementRoundCandidateSlots.id,slot.id));
   await tx.update(placementRoundCandidateSlots).set({
    status:"BOOKED",applicationId:slot.applicationId,confirmedAt:new Date(),
    updatedAt:new Date(),version:target.version+1,
   }).where(eq(placementRoundCandidateSlots.id,target.id));
   // An exception must retain the approved reschedule request that authorizes
   // its schedule override. Never invent an ID for a required foreign key.
   const [sourceRequest]=await tx.select({id:placementLearnerRequests.id})
    .from(placementLearnerRequests).where(and(
     eq(placementLearnerRequests.applicationId,slot.applicationId),
     eq(placementLearnerRequests.roundId,info.round.id),
     eq(placementLearnerRequests.requestType,"ROUND_RESCHEDULE"),
     eq(placementLearnerRequests.status,"APPROVED"),
    )).orderBy(desc(placementLearnerRequests.requestedAt)).limit(1);
   if(!sourceRequest)throw new PlacementsServiceError("PLACEMENT_REQUEST_NOT_FOUND");
   await tx.insert(placementApplicationRoundExceptions).values({
    applicationId:slot.applicationId,roundId:info.round.id,
    requestId:sourceRequest.id,
    scheduledAt:target.startsAt,timezone:"Asia/Kolkata",
    mode:info.round.mode==="VIRTUAL"?"VIRTUAL":"ON_CAMPUS",
    venue:info.round.mode==="VIRTUAL"?null:target.room,
    meetingUrl:info.round.mode==="VIRTUAL"?info.round.meetingUrl:null,
   }).onConflictDoUpdate({
    target:[placementApplicationRoundExceptions.applicationId,placementApplicationRoundExceptions.roundId],
    set:{scheduledAt:target.startsAt,timezone:"Asia/Kolkata",
     mode:info.round.mode==="VIRTUAL"?"VIRTUAL":"ON_CAMPUS",
     venue:info.round.mode==="VIRTUAL"?null:target.room,
     meetingUrl:info.round.mode==="VIRTUAL"?info.round.meetingUrl:null,
     updatedAt:new Date()},
   });
   await notice(tx,context,job,slot.applicationId,"PLACEMENTS_TPO_INTERVIEW_MOVED",
    "Your interview for "+job.title+" was moved to "+target.startsAt.toISOString()+" ("+target.room+"). "+input.reason);
   return {moved:1};
  }
  throw Error("Unsupported slot action");
 });
}
