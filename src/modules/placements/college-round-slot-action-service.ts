import "server-only";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {and,asc,eq,inArray,ne,lt,gt,gte,notExists,not,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,placementApplications,
 placementApplicationScreenings,placementJobRounds,placementJobs,placementLearnerRequests,users} from "@/db/schema";
import {placementRoundCandidateSlots as slots} from "@/db/schema/placement-round-candidate-slots";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {collegeDriveIdSchema} from "./college-drive-read-model";
import {collegeInterviewActionSchema} from "./college-interview-action-model";

async function scope(ctx:RequestContext,raw:unknown){
 const collegeId=await requireCollegePlacementAdmin(ctx),jobId=collegeDriveIdSchema.parse(raw);
 const [job]=await getDb().select({id:placementJobs.id,title:placementJobs.title,
  status:placementJobs.status,companyRelationshipId:placementJobs.companyRelationshipId}).from(placementJobs).where(and(eq(placementJobs.id,jobId),
  eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw Error("Placement drive not found");
 return {collegeId,job};
}
function viewSlot(s:typeof slots.$inferSelect,outcome?:string){
 const virtual=s.room.startsWith("https://");
 return {id:s.id,jobId:s.jobId,roundId:s.roundId,applicationId:s.applicationId??"",
  status:s.status==="CANCELLED"?"CANCELLED":outcome??"SCHEDULED",
  scheduledAt:s.startsAt.toISOString(),
  durationMinutes:Math.round((s.endsAt.getTime()-s.startsAt.getTime())/60000),
  mode:virtual?"VIRTUAL":"ON_CAMPUS",venue:virtual?null:s.room,
  meetingUrl:virtual?s.room:null,interviewer:s.panel,outcomeNote:null,
  version:s.version,interviewType:s.legacyInterviewType,
  roundDescription:s.legacyRoundDescription};
}
export type CollegeRoundSlotAppointmentFilters = {
 appointmentPage?:number;
 appointmentStatus?:"ALL"|"UPCOMING"|"COMPLETED"|"CANCELLED";
 appointmentMode?:"ALL"|"ON_CAMPUS"|"VIRTUAL";
 appointmentSearch?:string;
 preferredApplicationId?:string;
};
/** Source-of-truth candidate appointments, filtered and paged before capping.
 * Omitted filters retain the legacy 2,000-row API snapshot contract.
 * The two drive interview pages pass appointmentPage for 50-row browsing.
 */
export async function getCollegeRoundSlotAppointments(
 ctx:RequestContext,raw:unknown,filters:CollegeRoundSlotAppointmentFilters={},
){
 const {collegeId,job}=await scope(ctx,raw);
 const db=getDb();
 const now=new Date();
 const done=sql`exists(select 1 from ${activityEvents} ev where ev.subject_id=${slots.id}
    and ev.subject_type='placement_round_candidate_slot'
    and ev.event_type='PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED')`;
 const noShow=sql`exists(select 1 from ${activityEvents} ev where ev.subject_id=${slots.id}
    and ev.subject_type='placement_round_candidate_slot'
    and ev.event_type='PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW')`;
 const status=filters.appointmentStatus;
 const stateWhere=status==="CANCELLED"
  ?or(eq(slots.status,"CANCELLED"),noShow)
  :status==="COMPLETED"
   ?and(eq(slots.status,"BOOKED"),not(noShow),or(done,lt(slots.startsAt,now)))
   :status==="UPCOMING"
    ?and(eq(slots.status,"BOOKED"),not(done),not(noShow),gte(slots.startsAt,now))
    :undefined;
 const search=filters.appointmentSearch?.trim().toLowerCase().slice(0,120)??"";
 const roomVirtual=sql`${slots.room} like 'https://%'`;
 const bookingWhere=and(
  eq(slots.jobId,job.id),inArray(slots.status,["BOOKED","CANCELLED"]),
  stateWhere,
  filters.appointmentMode==="VIRTUAL"?roomVirtual:
   filters.appointmentMode==="ON_CAMPUS"?not(roomVirtual):undefined,
  search?(/^[0-9a-f-]+$/.test(search)?
   sql`cast(${slots.applicationId} as text) like ${"%"+search+"%"}`:sql`false`):undefined,
 );
 const candidateWhere=and(
  eq(placementApplications.jobId,job.id),eq(placementApplications.status,"SUBMITTED"),
  eq(placementApplicationScreenings.status,"SHORTLISTED"),
 );
 const [rounds,candidates,candidateCount,appointmentCount]=await Promise.all([
  db.select({id:placementJobRounds.id,name:placementJobRounds.name,
   status:placementJobRounds.status,kind:placementJobRounds.kind})
   .from(placementJobRounds).where(and(eq(placementJobRounds.jobId,job.id),
    eq(placementJobRounds.kind,"INTERVIEW"),ne(placementJobRounds.status,"CANCELLED")))
   .orderBy(asc(placementJobRounds.sequence)),
  db.select({applicationId:placementApplications.id,name:users.displayName,
   screening:placementApplicationScreenings.status})
   .from(placementApplications)
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,collegeId)))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .where(candidateWhere).orderBy(asc(users.displayName),asc(placementApplications.id)).limit(1000),
  db.select({total:sql<number>`count(*)::int`}).from(placementApplications)
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,collegeId)))
   .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .where(candidateWhere),
  db.select({total:sql<number>`count(*)::int`}).from(slots).where(bookingWhere),
 ]);
 // A candidate deep-linked from the private application drawer remains
 // schedulable even when the name-sorted dropdown is beyond its 1,000-row cap.
 if(filters.preferredApplicationId &&
    /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(filters.preferredApplicationId) &&
    !candidates.some(c=>c.applicationId===filters.preferredApplicationId)){
  const preferred=await db.select({applicationId:placementApplications.id,
   name:users.displayName,screening:placementApplicationScreenings.status})
   .from(placementApplications)
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,collegeId)))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .where(and(candidateWhere,eq(placementApplications.id,filters.preferredApplicationId))).limit(1);
  if(preferred[0])candidates.push(preferred[0]);
 }
 const candidateTotal=candidateCount[0]?.total??0;
 const appointmentTotal=appointmentCount[0]?.total??0;
 const appointmentPageSize=filters.appointmentPage===undefined?2000:50;
 const appointmentPages=Math.max(1,Math.ceil(appointmentTotal/appointmentPageSize));
 const requested=filters.appointmentPage;
 const appointmentPage=requested!==undefined&&Number.isSafeInteger(requested)&&requested>0
  ?Math.min(requested,appointmentPages):1;
 const bookings=await db.select().from(slots).where(bookingWhere)
  .orderBy(asc(slots.startsAt),asc(slots.id))
  .limit(appointmentPageSize).offset((appointmentPage-1)*appointmentPageSize);
 const ids=bookings.map(row=>row.id);
 const events=ids.length?await db.select({id:activityEvents.id,subjectId:activityEvents.subjectId,
  eventType:activityEvents.eventType,occurredAt:activityEvents.occurredAt})
  .from(activityEvents).where(and(eq(activityEvents.collegeId,collegeId),
   eq(activityEvents.subjectType,"placement_round_candidate_slot"),
   inArray(activityEvents.subjectId,ids),
   inArray(activityEvents.eventType,["PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED",
    "PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW"])))
  .orderBy(asc(activityEvents.occurredAt),asc(activityEvents.id)):[];
 const outcomes=new Map<string,string>();
 for(const event of events)if(event.subjectId)outcomes.set(event.subjectId,
   event.eventType==="PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED"?"COMPLETED":"NO_SHOW");
 return {job,storageReady:true,rounds,candidates,
  candidateTotal,appointmentTotal,appointmentPage,appointmentPageSize,appointmentPages,
  interviews:bookings.map(row=>viewSlot(row,outcomes.get(row.id)))};
}

export async function mutateCollegeRoundSlotInterview(ctx:RequestContext,rawJobId:unknown,raw:unknown){
 const {collegeId,job}=await scope(ctx,rawJobId);
 const acting=await resolveActingCollege(ctx,"placements.manage");
 const cmd=collegeInterviewActionSchema.parse(raw);
 if(job.status!=="PUBLISHED")throw Error("Only an open drive may schedule interviews.");
 return getDb().transaction(async tx=>{
  const [currentJob]=await tx.select({status:placementJobs.status})
   .from(placementJobs).where(and(eq(placementJobs.id,job.id),
    eq(placementJobs.collegeId,collegeId))).for("share").limit(1);
  if(currentJob?.status!=="PUBLISHED")throw Error("The drive has changed status.");
  let booked:typeof slots.$inferSelect;
  let learnerApplicationId:string;
  let eventType:string;
  let message:string;
  if(cmd.action==="SCHEDULE"||cmd.action==="EDIT"){
   const a=cmd.appointment;
   const start=new Date(a.scheduledAt),end=new Date(start.getTime()+a.durationMinutes*60_000);
   if(start<=new Date())throw Error("The selected date and time is in the past");
   const [app]=await tx.select({id:placementApplications.id,userId:collegeMemberships.userId,
    membershipId:placementApplications.membershipId})
    .from(placementApplications)
    .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
      eq(collegeMemberships.collegeId,collegeId)))
    .innerJoin(placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId,placementApplications.id))
    .where(and(eq(placementApplications.id,a.applicationId),
      eq(placementApplications.jobId,job.id),eq(placementApplications.status,"SUBMITTED"),
      eq(placementApplicationScreenings.status,"SHORTLISTED"))).limit(1);
   if(!app)throw Error("Only an eligible shortlisted applicant can be scheduled.");
   // Serialize same-learner bookings across every drive/round by college
   // membership before taking the round lock or checking any overlaps.
   const [lockedLearner]=await tx.select({id:collegeMemberships.id})
    .from(collegeMemberships)
    .where(and(eq(collegeMemberships.id,app.membershipId),
      eq(collegeMemberships.collegeId,collegeId))).for("update").limit(1);
   if(!lockedLearner)throw Error("Candidate is no longer in this college.");
   const [round]=await tx.select({id:placementJobRounds.id,status:placementJobRounds.status})
    .from(placementJobRounds).where(and(eq(placementJobRounds.id,a.roundId),
      eq(placementJobRounds.jobId,job.id),eq(placementJobRounds.kind,"INTERVIEW")))
    .for("update").limit(1);
   if(!round||!["SCHEDULED","PENDING"].includes(round.status))
    throw Error("Interview round is not schedulable.");

   const room=a.mode==="VIRTUAL"?a.meetingUrl!:a.venue!;
   const oldId=cmd.action==="EDIT"?cmd.interviewId:null;
   const normalizedRoom=room.trim().toLocaleLowerCase("en-IN");
   const normalizedPanel=a.interviewer?.trim().toLocaleLowerCase("en-IN")??"";
   // Completed/no-show bookings remain BOOKED for history but are not active.
   const activeSlot=notExists(tx.select({id:activityEvents.id}).from(activityEvents)
    .where(and(eq(activityEvents.subjectId,slots.id),
     eq(activityEvents.subjectType,"placement_round_candidate_slot"),
     inArray(activityEvents.eventType,[
      "PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED","PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW",
     ]))));
   if(cmd.action==="SCHEDULE"){
    const [prior]=await tx.select({id:slots.id}).from(slots)
     .where(and(eq(slots.applicationId,a.applicationId),eq(slots.status,"BOOKED"),
      activeSlot)).limit(1);
    if(prior)throw Error(
     "Cannot schedule a new round while a previous round is still active (status: SCHEDULED). Please mark the current round as Completed or Cancel it first.",
    );
   }
   // A checked conflict query alone is not concurrency-safe when two
   // different learners are booked into the same room across separate jobs.
   // Transaction advisory locks serialize writes for each shared resource.
   // Sort keys to avoid deadlocks between competing room/interviewer edits.
   const resourceKeys=[
    collegeId+":interview-room:"+normalizedRoom,
    ...(normalizedPanel?[collegeId+":interview-panel:"+job.companyRelationshipId+":"+normalizedPanel]:[]),
   ].sort();
   for(const key of resourceKeys){
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
   }
   // Whole-college conflict query, not the first 2000 job-specific rows.
   // Preserve the 15-minute calendar conflict buffer for candidate, room
   // and same-company interviewer; unchanged EDIT row is excluded.
   const bufferMs=15*60_000;
   const overlapping=await tx.select({
     id:slots.id,applicationId:slots.applicationId,room:slots.room,
     panel:slots.panel,membershipId:placementApplications.membershipId,
     companyRelationshipId:placementJobs.companyRelationshipId,
   }).from(slots)
    .innerJoin(placementJobs,and(eq(placementJobs.id,slots.jobId),
      eq(placementJobs.collegeId,collegeId)))
    .leftJoin(placementApplications,eq(placementApplications.id,slots.applicationId))
    .where(and(eq(slots.status,"BOOKED"),activeSlot,
      lt(slots.startsAt,new Date(end.getTime()+bufferMs)),
      gt(slots.endsAt,new Date(start.getTime()-bufferMs))));
   if(overlapping.some(x=>x.id!==oldId&&x.membershipId===app.membershipId))
    throw Error("This candidate already has an interview that overlaps with the requested time. Please choose a different slot.");
   if(overlapping.some(x=>x.id!==oldId&&
      x.room.trim().toLocaleLowerCase("en-IN")===normalizedRoom))
    throw Error("The candidate or room already has an overlapping interview.");
   if(normalizedPanel&&overlapping.some(x=>x.id!==oldId&&
      x.companyRelationshipId===job.companyRelationshipId&&
      x.panel?.trim().toLocaleLowerCase("en-IN")===normalizedPanel))
    throw Error("This interviewer already has an overlapping interview scheduled for this company. Please choose a different slot or interviewer.");
   if(cmd.action==="SCHEDULE"){
    const [saved]=await tx.insert(slots).values({
     jobId:job.id,roundId:a.roundId,applicationId:a.applicationId,
     startsAt:start,endsAt:end,room,panel:a.interviewer,status:"BOOKED",
     legacyInterviewType:a.interviewType??null,legacyRoundDescription:a.roundDescription??null,
     source:"TPO",confirmedAt:new Date(),changedByUserId:ctx.user.id,
    }).returning();
    booked=saved;
    eventType="PLACEMENTS_COLLEGE_INTERVIEW_SCHEDULED";
    message="Interview scheduled for "+job.title+" on "+start.toISOString()+".";
   }else{
    const [old]=await tx.select().from(slots).where(and(eq(slots.id,cmd.interviewId),
     eq(slots.jobId,job.id),eq(slots.status,"BOOKED")))
     .for("update").limit(1);
    if(!old||old.version!==cmd.expectedVersion||old.roundId!==a.roundId||
      old.applicationId!==a.applicationId)throw Error("Interview changed; refresh and retry.");
    const [saved]=await tx.update(slots).set({startsAt:start,endsAt:end,room,
     legacyInterviewType:a.interviewType??old.legacyInterviewType,
     legacyRoundDescription:a.roundDescription??old.legacyRoundDescription,
     panel:a.interviewer,version:old.version+1,changedByUserId:ctx.user.id,updatedAt:new Date()})
     .where(and(eq(slots.id,old.id),eq(slots.version,old.version))).returning();
    if(!saved)throw Error("Interview changed; refresh and retry.");
    booked=saved;
    eventType="PLACEMENTS_COLLEGE_INTERVIEW_RESCHEDULED";
    message="Interview rescheduled for "+job.title+" on "+start.toISOString()+". "+cmd.reason;
   }
   learnerApplicationId=a.applicationId;
  }else{
   const [old]=await tx.select().from(slots).where(and(eq(slots.id,cmd.interviewId),
     eq(slots.jobId,job.id),eq(slots.status,"BOOKED"))).for("update").limit(1);
   if(!old||old.version!==cmd.expectedVersion||!old.applicationId)
    throw Error("Interview changed; refresh and retry.");
   const [prior]=await tx.select({eventType:activityEvents.eventType})
    .from(activityEvents).where(and(eq(activityEvents.subjectId,old.id),
      eq(activityEvents.subjectType,"placement_round_candidate_slot"),
      inArray(activityEvents.eventType,["PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED",
       "PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW"]))).limit(1);
   if(prior)throw Error("An interview outcome is already recorded.");
   if(cmd.action==="NO_SHOW"){
    const [withdrawal]=await tx.select({id:placementLearnerRequests.id})
     .from(placementLearnerRequests)
     .where(and(eq(placementLearnerRequests.applicationId,old.applicationId),
      eq(placementLearnerRequests.requestType,"APPLICATION_WITHDRAWAL"),
      eq(placementLearnerRequests.status,"PENDING"))).limit(1);
    if(withdrawal)throw Error("Candidate has a pending withdrawal request; do not mark no-show.");
   }
   learnerApplicationId=old.applicationId;
   const [saved]=await tx.update(slots).set({
    status:cmd.action==="CANCEL"?"CANCELLED":"BOOKED",
    applicationId:cmd.action==="CANCEL"?null:old.applicationId,
    version:old.version+1,changedByUserId:ctx.user.id,updatedAt:new Date(),
   }).where(and(eq(slots.id,old.id),eq(slots.version,old.version))).returning();
   if(!saved)throw Error("Interview changed; refresh and retry.");
   booked=saved;eventType="PLACEMENTS_COLLEGE_INTERVIEW_"+cmd.action;
   message="Your interview for "+job.title+" was "+
    cmd.action.toLowerCase().replaceAll("_"," ")+". "+cmd.reason;
  }
  const [learner]=await tx.select({userId:collegeMemberships.userId})
   .from(placementApplications).innerJoin(collegeMemberships,
    eq(collegeMemberships.id,placementApplications.membershipId))
   .where(and(eq(placementApplications.id,learnerApplicationId),
     eq(placementApplications.jobId,job.id),eq(collegeMemberships.collegeId,collegeId))).limit(1);
  if(!learner)throw Error("Candidate is no longer in this college.");
  const [audit]=await tx.insert(activityEvents).values({
   organizationId:acting.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership?.collegeId===collegeId?ctx.membership.id:null,
   module:"PLACEMENTS",eventType,
   subjectType:"placement_round_candidate_slot",subjectId:booked.id,
   summary:message,metadata:{jobId:job.id,applicationId:learnerApplicationId,
    roundId:booked.roundId,room:booked.room,version:booked.version},
  }).returning({id:activityEvents.id});
  await tx.insert(inAppNotifications).values({
   userId:learner.userId,eventId:audit.id,title:"Interview update",
   body:message,actionHref:"/learn/my-placements/interviews",
  }).onConflictDoNothing();
  return {id:booked.id,status:cmd.action==="SCHEDULE"||cmd.action==="EDIT"?
   "SCHEDULED":cmd.action,version:booked.version};
 });
}
