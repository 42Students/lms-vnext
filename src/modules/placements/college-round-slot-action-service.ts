import "server-only";
import {z} from "zod";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {and,asc,desc,eq,exists,ilike,inArray,ne,lt,gt,gte,notExists,not,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,placementApplications,
 placementApplicationScreenings,placementJobRounds,placementJobs,placementLearnerRequests,users} from "@/db/schema";
import {placementRoundCandidateSlots as slots} from "@/db/schema/placement-round-candidate-slots";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {collegeDriveIdSchema} from "./college-drive-read-model";
import {collegeInterviewActionSchema} from "./college-interview-action-model";
import {placementCollegeApplicationStages,placementCollegeApplicationStageHistory}
 from "@/db/schema/placement-college-application-stages";

/** A persisted interview instant is displayed in the college's IST zone. */
function roundInterviewInstantIst(value: Date): string {
 return new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(value);
}

/** The current write API remains job/round/application scoped; old jobApplication
 * and learner IDs resolve through the chosen college membership, never across tenants. */
export const collegeInterviewLegacyActionMap={
 create:"SCHEDULE",update:"EDIT",cancel:"CANCEL",complete:"COMPLETE",noShow:"NO_SHOW",
 response:"id/status/version",
} as const;
/** Field-by-field old Interview -> candidate-slot crosswalk. Imported integer
 * identities are references only: tenant-safe reads use the UUID booking and
 * its matching college/job/application, not an integer from the URL.
 * Stored instants are timestamptz; UI displays Asia/Kolkata. Preserve the
 * imported source time zone when available; do not reinterpret wall time.
 */
export const COLLEGE_INTERVIEW_LEGACY_FIELD_MAP={
 id:"legacyInterviewId -> placement_round_candidate_slots.id",
 learner:"legacyLearnerId -> application.membership.user; college-validated",
 jobApplication:"legacyApplicationId -> applicationId",
 job:"legacyJobId -> jobId",
 organization:"legacyOrganizationId -> job.collegeId through tenant scope",
 interviewType:"legacyInterviewType -> interviewType",
 interviewStatus:"legacyInterviewStatus + booking/outcome events -> status",
 scheduledDate:"legacyScheduledAt/startsAt -> scheduledAt (UTC instant, IST display)",
 location:"legacyLocation or room -> venue or meetingUrl",
 interviewer:"legacyInterviewerName or panel -> interviewer",
 duration:"legacyDurationMinutes or endsAt-startsAt -> durationMinutes",
 sourceZone:"legacySourceTimeZone retained, never used to offset the stored instant",
} as const;

export class CollegeInterviewFieldError extends Error {
 constructor(readonly field:"scheduledAt"|"meetingUrl",message:string){super(message);this.name="CollegeInterviewFieldError";}
}
async function scope(ctx:RequestContext,raw:unknown){
 const collegeId=await requireCollegePlacementAdmin(ctx),jobId=collegeDriveIdSchema.parse(raw);
 const [job]=await getDb().select({id:placementJobs.id,title:placementJobs.title,
  status:placementJobs.status,companyRelationshipId:placementJobs.companyRelationshipId}).from(placementJobs).where(and(eq(placementJobs.id,jobId),
  eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw Error("Placement drive not found");
 return {collegeId,job};
}
function viewSlot(s:typeof slots.$inferSelect,outcome?:string,feedback?:string|null,editNotes?:string|null,conflictKinds:readonly string[]=[]){
 const virtual=s.room.startsWith("https://");
 const status=s.status==="CANCELLED"?"CANCELLED":outcome??(
  s.legacyInterviewStatus==="RESCHEDULE_REQUESTED"?"RESCHEDULE_REQUESTED":
  s.legacyInterviewStatus==="CONFIRMED"||s.learnerConfirmedAt?"CONFIRMED":"SCHEDULED");
 return {id:s.id,jobId:s.jobId,roundId:s.roundId,applicationId:s.applicationId??"",
  status,
  scheduledAt:s.startsAt.toISOString(),
  durationMinutes:Math.round((s.endsAt.getTime()-s.startsAt.getTime())/60000),
  mode:virtual?"VIRTUAL":"ON_CAMPUS",venue:virtual?null:s.room,
  meetingUrl:virtual?s.room:null,interviewer:s.panel,outcomeNote:feedback??null,
  version:s.version,interviewType:s.legacyInterviewType,
  roundDescription:s.legacyRoundDescription,editNotes:editNotes??null,
  hasConflict:conflictKinds.length>0,conflictKinds,
  statusLabel:status==="CANCELLED"?"Cancelled":status==="NO_SHOW"?"No Show":
   status==="COMPLETED"?"Completed":status==="CONFIRMED"?"Confirmed":
   status==="RESCHEDULE_REQUESTED"?"Reschedule":"Scheduled",
  notificationChannels:["IN_APP"] as const};
}
/** Delivery-channel parity is explicit, not guessed. In-app notices are
 * persisted in the same transaction as the interview. Email/push/reminders
 * need an approved message-outbox producer and DLT/email templates; none
 * are promised by the scheduling action until a provider is registered. */
export const COLLEGE_INTERVIEW_NOTIFICATION_CHANNELS={
  inApp:"PERSISTED_ATOMICALLY",
  email:"NOT_CONFIGURED",
  push:"NOT_CONFIGURED",
  reminders:"NOT_CONFIGURED",
} as const;
export type CollegeRoundSlotAppointmentFilters = {
 appointmentPage?:number;
 appointmentStatus?:"ALL"|"ACTIVE"|"UPCOMING"|"COMPLETED"|"CANCELLED";
 appointmentMode?:"ALL"|"ON_CAMPUS"|"VIRTUAL";
 appointmentSearch?:string;
 appointmentPageSize?:number;
 candidatePage?:number;
 candidatePageSize?:number;
 candidateSearch?:string;
 appointmentSort?:"DATE_ASC"|"DATE_DESC"|"JOB"|"STATUS";
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
 const done=sql`exists(select 1 from ${activityEvents} ev where ev.subject_id=${slots.id}::text
    and ev.subject_type='placement_round_candidate_slot'
    and ev.event_type='PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED')`;
 const noShow=sql`exists(select 1 from ${activityEvents} ev where ev.subject_id=${slots.id}::text
    and ev.subject_type='placement_round_candidate_slot'
    and ev.event_type='PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW')`;
 const status=filters.appointmentStatus;
 const stateWhere=status==="CANCELLED"
  ?or(eq(slots.status,"CANCELLED"),noShow)
  :status==="COMPLETED"
   ?and(eq(slots.status,"BOOKED"),not(noShow),or(done,lt(slots.startsAt,now)))
   :status==="UPCOMING"
    ?and(eq(slots.status,"BOOKED"),not(done),not(noShow),gte(slots.startsAt,now))
    // Legacy Active: still booked and neither completed nor cancelled, whatever the date.
    :status==="ACTIVE"
     ?and(eq(slots.status,"BOOKED"),not(done),not(noShow))
     :undefined;
 const search=filters.appointmentSearch?.trim().slice(0,120)??"";
 const searchPattern="%"+search.replace(/[%_\\]/g,part=>"\\"+part)+"%";
 const candidateNameMatch=search?exists(db.select({id:placementApplications.id})
  .from(placementApplications)
  .innerJoin(collegeMemberships,and(
    eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,collegeId),
  ))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(
    eq(placementApplications.id,slots.applicationId),
    ilike(users.displayName,searchPattern),
  ))):undefined;
 const roomVirtual=sql`${slots.room} like 'https://%'`;
 const bookingWhere=and(
  eq(slots.jobId,job.id),inArray(slots.status,["BOOKED","CANCELLED"]),
  stateWhere,
  filters.appointmentMode==="VIRTUAL"?roomVirtual:
   filters.appointmentMode==="ON_CAMPUS"?not(roomVirtual):undefined,
  search&&!job.title.toLowerCase().includes(search.toLowerCase())
   ?or(sql`cast(${slots.applicationId} as text) ilike ${searchPattern}`,
      candidateNameMatch):undefined,
 );
 const currentStageMatches=exists(db.select({id:placementCollegeApplicationStages.id})
  .from(placementCollegeApplicationStages)
  .where(and(eq(placementCollegeApplicationStages.applicationId,placementApplications.id),
   eq(placementCollegeApplicationStages.jobId,job.id),
   inArray(placementCollegeApplicationStages.stage,["SHORTLISTED","ASSESSMENT","INTERVIEW","OFFERED","HIRED"]))));
 const stageRejected=exists(db.select({id:placementCollegeApplicationStages.id})
  .from(placementCollegeApplicationStages)
  .where(and(eq(placementCollegeApplicationStages.applicationId,placementApplications.id),
   eq(placementCollegeApplicationStages.jobId,job.id),
   eq(placementCollegeApplicationStages.stage,"REJECTED"))));
 const candidateNeedle=filters.candidateSearch?.trim().slice(0,120)??"";
 const candidateSearchPattern="%"+candidateNeedle.replace(/[%_\\]/g,part=>"\\"+part)+"%";
 const candidateSearchMatch=candidateNeedle?exists(db.select({id:collegeMemberships.id})
   .from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(eq(collegeMemberships.id,placementApplications.membershipId),
     eq(collegeMemberships.collegeId,collegeId),
     ilike(users.displayName,candidateSearchPattern)))):undefined;
 const candidatePageSize=filters.candidatePageSize===undefined?1000:
   [10,20,50,100,200,1000].includes(filters.candidatePageSize)?filters.candidatePageSize:20;
 const candidatePage=Number.isSafeInteger(filters.candidatePage)&&
   (filters.candidatePage??0)>0?filters.candidatePage!:1;
 const candidateWhere=and(
  candidateSearchMatch,
  eq(placementApplications.jobId,job.id),eq(placementApplications.status,"SUBMITTED"),
  ne(placementApplicationScreenings.status,"REJECTED"),not(stageRejected),
  or(eq(placementApplicationScreenings.status,"SHORTLISTED"),currentStageMatches),
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
   .where(candidateWhere).orderBy(asc(users.displayName),asc(placementApplications.id))
   .limit(candidatePageSize).offset((candidatePage-1)*candidatePageSize),
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
 const candidatePages=Math.max(1,Math.ceil(candidateTotal/candidatePageSize));
 const appointmentTotal=appointmentCount[0]?.total??0;
 const appointmentPageSize=filters.appointmentPage===undefined?2000:
   [10,20,50,100].includes(filters.appointmentPageSize??20)?filters.appointmentPageSize??20:20;
 const appointmentPages=Math.max(1,Math.ceil(appointmentTotal/appointmentPageSize));
 const requested=filters.appointmentPage;
 const appointmentPage=requested!==undefined&&Number.isSafeInteger(requested)&&requested>0
  ?Math.min(requested,appointmentPages):1;
 // Legacy calendar has Date earliest/latest, Job and Status sorting. Drive
 // pages already scope to one job, so Job order is its stable date order.
 // Status uses the persisted completion/absence events before pagination.
 const statusOrder=sql`case
   when ${slots.status}='CANCELLED' then 'CANCELLED'
   when ${noShow} then 'NO_SHOW'
   when ${done} then 'COMPLETED'
   when ${slots.legacyInterviewStatus}='RESCHEDULE_REQUESTED' then 'RESCHEDULE_REQUESTED'
   when ${slots.legacyInterviewStatus}='CONFIRMED' then 'CONFIRMED'
   else 'SCHEDULED' end`;
 const bookings=await db.select().from(slots).where(bookingWhere)
  .orderBy(filters.appointmentSort==="STATUS"?asc(statusOrder):
     filters.appointmentSort==="DATE_DESC"?desc(slots.startsAt):asc(slots.startsAt),
    filters.appointmentSort==="DATE_DESC"?desc(slots.startsAt):asc(slots.startsAt),
    asc(slots.id))
  .limit(appointmentPageSize).offset((appointmentPage-1)*appointmentPageSize);
 const ids=bookings.map(row=>row.id);
 const events=ids.length?await db.select({id:activityEvents.id,subjectId:activityEvents.subjectId,
  eventType:activityEvents.eventType,occurredAt:activityEvents.occurredAt,
  metadata:activityEvents.metadata})
  .from(activityEvents).where(and(eq(activityEvents.collegeId,collegeId),
   eq(activityEvents.subjectType,"placement_round_candidate_slot"),
   inArray(activityEvents.subjectId,ids),
   inArray(activityEvents.eventType,["PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED",
    "PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW","PLACEMENTS_COLLEGE_INTERVIEW_FEEDBACK",
    "PLACEMENTS_COLLEGE_INTERVIEW_RESCHEDULED"])))
  .orderBy(asc(activityEvents.occurredAt),asc(activityEvents.id)):[];
 const outcomes=new Map<string,string>();
 const feedbackBySlot=new Map<string,string>();
 const editNotesBySlot=new Map<string,string>();
 for(const event of events){
  if(!event.subjectId)continue;
  if(event.eventType==="PLACEMENTS_COLLEGE_INTERVIEW_FEEDBACK"){
   const metadata=event.metadata as Record<string,unknown>|null;
   if(typeof metadata?.["feedback"]==="string")feedbackBySlot.set(event.subjectId,metadata["feedback"]);
  }else if(event.eventType==="PLACEMENTS_COLLEGE_INTERVIEW_RESCHEDULED"){
   const metadata=event.metadata as Record<string,unknown>|null;
   if(typeof metadata?.["notes"]==="string")editNotesBySlot.set(event.subjectId,metadata["notes"]);
  }else outcomes.set(event.subjectId,
   event.eventType==="PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED"?"COMPLETED":"NO_SHOW");
 }
 // The selected learner's open appointments across this college form an
 // authorized conflict preview. Never return other candidates, private
 // meeting URLs, interviewer names or a truncated, silent conflict list.
 let candidateConflicts:Array<{id:string;jobTitle:string;startsAt:string;endsAt:string}>=[];
 let candidateConflictsHasMore=false;
 if(filters.preferredApplicationId){
  const [preferred]=await db.select({membershipId:placementApplications.membershipId})
   .from(placementApplications)
   .innerJoin(collegeMemberships,and(
     eq(collegeMemberships.id,placementApplications.membershipId),
     eq(collegeMemberships.collegeId,collegeId)))
   .where(and(eq(placementApplications.id,filters.preferredApplicationId),
     eq(placementApplications.jobId,job.id))).limit(1);
  if(preferred){
   const conflictRows=await db.select({
     id:slots.id,title:placementJobs.title,
     startsAt:slots.startsAt,endsAt:slots.endsAt,
   }).from(slots)
    .innerJoin(placementApplications,eq(placementApplications.id,slots.applicationId))
    .innerJoin(placementJobs,and(eq(placementJobs.id,slots.jobId),
      eq(placementJobs.collegeId,collegeId)))
    .where(and(eq(placementApplications.membershipId,preferred.membershipId),
      eq(slots.status,"BOOKED"),gte(slots.endsAt,now),
      notExists(db.select({id:activityEvents.id}).from(activityEvents)
       .where(and(eq(activityEvents.subjectId,sql<string>`${slots.id}::text`),
         eq(activityEvents.subjectType,"placement_round_candidate_slot"),
         inArray(activityEvents.eventType,[
           "PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED",
           "PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW",
         ]))))))
    .orderBy(asc(slots.startsAt),asc(slots.id)).limit(101);
   candidateConflictsHasMore=conflictRows.length>100;
   candidateConflicts=conflictRows.slice(0,100).map(row=>({
     id:row.id,jobTitle:row.title,
     startsAt:row.startsAt.toISOString(),endsAt:row.endsAt.toISOString(),
   }));
  }
 }
 return {job,storageReady:true,rounds,candidates,
  notificationChannels:COLLEGE_INTERVIEW_NOTIFICATION_CHANNELS,
  candidateTotal,candidatePage,candidatePageSize,candidatePages,
  candidateHasMore:candidatePage<candidatePages,
  candidateConflicts,candidateConflictsHasMore,
  appointmentTotal,appointmentPage,appointmentPageSize,appointmentPages,
  interviews:bookings.map(row=>viewSlot(row,outcomes.get(row.id),feedbackBySlot.get(row.id),editNotesBySlot.get(row.id)))};
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
   if(start<=new Date())throw new CollegeInterviewFieldError("scheduledAt","The selected date and time is in the past");
   if(a.mode==="VIRTUAL"&&!a.meetingUrl?.startsWith("https://"))throw new CollegeInterviewFieldError("meetingUrl","Enter an HTTPS meeting link");
   const [app]=await tx.select({id:placementApplications.id,userId:collegeMemberships.userId,
    membershipId:placementApplications.membershipId})
    .from(placementApplications)
    .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
      eq(collegeMemberships.collegeId,collegeId)))
    .innerJoin(placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId,placementApplications.id))
    .where(and(eq(placementApplications.id,a.applicationId),
      eq(placementApplications.jobId,job.id),eq(placementApplications.status,"SUBMITTED"),
      ne(placementApplicationScreenings.status,"REJECTED"),
      not(exists(tx.select({id:placementCollegeApplicationStages.id})
       .from(placementCollegeApplicationStages)
       .where(and(eq(placementCollegeApplicationStages.applicationId,placementApplications.id),
        eq(placementCollegeApplicationStages.jobId,job.id),
        eq(placementCollegeApplicationStages.stage,"REJECTED"))))),
      or(eq(placementApplicationScreenings.status,"SHORTLISTED"),
       exists(tx.select({id:placementCollegeApplicationStages.id})
        .from(placementCollegeApplicationStages)
        .where(and(eq(placementCollegeApplicationStages.applicationId,placementApplications.id),
         eq(placementCollegeApplicationStages.jobId,job.id),
         inArray(placementCollegeApplicationStages.stage,["SHORTLISTED","ASSESSMENT","INTERVIEW","OFFERED","HIRED"])))))))
    .limit(1);
   if(!app)throw Error("Only an eligible applicant at shortlist, assessment, interview, offer or hired stage can be scheduled; rejected and withdrawn applicants are excluded.");
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
    .where(and(eq(activityEvents.subjectId,sql<string>`${slots.id}::text`),
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
    if(!saved)throw Error("Interview booking was not returned.");
    booked=saved;
    eventType="PLACEMENTS_COLLEGE_INTERVIEW_SCHEDULED";
    message="Interview scheduled for "+job.title+" on "+roundInterviewInstantIst(start)+".";
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
    message="Interview rescheduled for "+job.title+" on "+roundInterviewInstantIst(start)+". "+cmd.reason;
   }
   learnerApplicationId=a.applicationId;
   // Match the old InterviewService auto-advance. Booking a real interview
   // advances a shortlisted/assessment learner's independent college
   // pipeline, but must never downgrade an offer, hire or rejected state.
   // Do it in this booking transaction so the visible stage and slot cannot
   // disagree after a partial response or concurrent staff mutation.
   const [priorStage]=await tx.select().from(placementCollegeApplicationStages)
    .where(and(eq(placementCollegeApplicationStages.applicationId,a.applicationId),
      eq(placementCollegeApplicationStages.jobId,job.id)))
    .for("update").limit(1);
   const priorName=priorStage?.stage??"SHORTLISTED";
   if(["APPLIED","SHORTLISTED","ASSESSMENT"].includes(priorName)){
    const reason="Interview scheduled in the placement calendar";
    const now=new Date();
    const [moved]=priorStage
     ?await tx.update(placementCollegeApplicationStages).set({
       stage:"INTERVIEW",previousStage:priorStage.stage,
       version:priorStage.version+1,movedByUserId:ctx.user.id,
       reason,movedAt:now,updatedAt:now,
      }).where(and(eq(placementCollegeApplicationStages.id,priorStage.id),
        eq(placementCollegeApplicationStages.version,priorStage.version)))
       .returning({id:placementCollegeApplicationStages.id})
     :await tx.insert(placementCollegeApplicationStages).values({
       jobId:job.id,applicationId:a.applicationId,
       stage:"INTERVIEW",previousStage:priorName,
       movedByUserId:ctx.user.id,reason,movedAt:now,updatedAt:now,
      }).onConflictDoNothing().returning({id:placementCollegeApplicationStages.id});
    if(!moved)throw Error("Pipeline stage changed. Refresh and retry.");
    await tx.insert(placementCollegeApplicationStageHistory).values({
     stageId:moved.id,fromStage:priorName,toStage:"INTERVIEW",
     reason,actorUserId:ctx.user.id,movedAt:now,
    });
   }
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
    roundId:booked.roundId,room:booked.room,version:booked.version,
    ...(cmd.action==="EDIT"?{notes:cmd.notes??null}: {})},
  }).returning({id:activityEvents.id});
  if(!audit)throw Error("Interview audit event was not returned.");
  await tx.insert(inAppNotifications).values({
   userId:learner.userId,eventId:audit.id,title:"Interview update",
   body:message,actionHref:"/learn/my-placements/interviews",
  }).onConflictDoNothing();
  return {id:booked.id,status:cmd.action==="SCHEDULE"||cmd.action==="EDIT"?
   "SCHEDULED":cmd.action,version:booked.version,notificationChannels:["IN_APP"] as const};
 });
}

/** Feedback is an immutable staff-authored interview event. Private scores
 * stay in the college-scoped audit metadata; learner notification is generic. */
const collegeInterviewFeedbackSchema=z.object({
 interviewId:z.string().uuid(),expectedVersion:z.number().int().positive(),
 score:z.number().int().min(1).max(5),
 feedback:z.string().trim().min(3).max(2000),
 confirmed:z.literal(true),
}).strict();
export async function submitCollegeInterviewFeedback(ctx:RequestContext,rawJobId:unknown,raw:unknown){
 const input=collegeInterviewFeedbackSchema.parse(raw);
 const {collegeId,job}=await scope(ctx,rawJobId);
 const acting=await resolveActingCollege(ctx,"placements.manage");
 return getDb().transaction(async tx=>{
  const [appointment]=await tx.select().from(slots)
   .where(and(eq(slots.id,input.interviewId),eq(slots.jobId,job.id),eq(slots.status,"BOOKED")))
   .for("update").limit(1);
  if(!appointment||!appointment.applicationId||appointment.version!==input.expectedVersion)
   throw Error("Interview changed; refresh and retry.");
  const [completed]=await tx.select({id:activityEvents.id}).from(activityEvents)
   .where(and(eq(activityEvents.subjectId,appointment.id),
    eq(activityEvents.collegeId,collegeId),
    eq(activityEvents.subjectType,"placement_round_candidate_slot"),
    eq(activityEvents.eventType,"PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED"))).limit(1);
  if(!completed)throw Error("Complete the interview before submitting feedback.");
  const [prior]=await tx.select({id:activityEvents.id}).from(activityEvents)
   .where(and(eq(activityEvents.collegeId,collegeId),
    eq(activityEvents.subjectId,appointment.id),
    eq(activityEvents.subjectType,"placement_round_candidate_slot"),
    eq(activityEvents.eventType,"PLACEMENTS_COLLEGE_INTERVIEW_FEEDBACK"))).limit(1);
  if(prior)throw Error("Feedback is already recorded for this interview.");
  const [candidate]=await tx.select({userId:collegeMemberships.userId})
   .from(placementApplications).innerJoin(collegeMemberships,
    eq(collegeMemberships.id,placementApplications.membershipId))
   .where(and(eq(placementApplications.id,appointment.applicationId),
    eq(placementApplications.jobId,job.id),eq(collegeMemberships.collegeId,collegeId))).limit(1);
  if(!candidate)throw Error("Applicant is no longer in this college.");
  const [saved]=await tx.update(slots).set({
    version:appointment.version+1,changedByUserId:ctx.user.id,updatedAt:new Date(),
   }).where(and(eq(slots.id,appointment.id),eq(slots.version,appointment.version)))
   .returning({version:slots.version});
  if(!saved)throw Error("Interview changed; refresh and retry.");
  const [event]=await tx.insert(activityEvents).values({
   organizationId:acting.organizationId,collegeId,
   actorUserId:ctx.user.id,
   actorMembershipId:ctx.membership?.collegeId===collegeId?ctx.membership.id:null,
   module:"PLACEMENTS",eventType:"PLACEMENTS_COLLEGE_INTERVIEW_FEEDBACK",
   subjectType:"placement_round_candidate_slot",subjectId:appointment.id,
   summary:"Interview feedback recorded",
   metadata:{jobId:job.id,applicationId:appointment.applicationId,
    roundId:appointment.roundId,score:input.score,feedback:input.feedback,
    version:saved.version},
  }).returning({id:activityEvents.id});
  if(!event)throw Error("Interview feedback audit event was not returned.");
  await tx.insert(inAppNotifications).values({
   userId:candidate.userId,eventId:event.id,title:"Interview update",
   body:"Interview feedback has been recorded for "+job.title+".",
   actionHref:"/learn/my-placements/interviews",
  }).onConflictDoNothing();
  return {ok:true,version:saved.version};
 });
}
