import "server-only";
import {and,asc,eq,ne,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,placementApplications,
 placementApplicationScreenings,placementJobRounds,placementJobs,placementLearnerRequests,users} from "@/db/schema";
import {placementCollegeInterviews} from "@/db/schema/placement-college-interviews";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {collegeDriveIdSchema} from "./college-drive-read-model";
import {collegeInterviewActionSchema} from "./college-interview-action-model";

/** Legacy Interview row crosswalk (no production data migration in vNext):
 * legacy job/application/learner integer keys -> scoped UUID placementJobs,
 * placementApplications and the resolved college membership;
 * legacy interview type -> INTERVIEW placementJobRounds kind;
 * status/date/mode/notes/version -> versioned placementCollegeInterviews;
 * individual candidate time slot -> placementRoundCandidateSlots when used;
 * legacy learner notifications -> same-transaction activityEvents plus
 * inAppNotifications with learner-scoped /learn/my-placements/interviews URL.
 * Unlike legacy, appointment and round result/attendance facts are distinct:
 * never synthesize an applied result or restore an arbitrary external link.
 */
/** Legacy one-record Interview was a combined appointment + panel + response +
 * feedback form. vNext composes these in this order without merging their
 * independently versioned sources or hiding the interviewer in a room label.
 * A round PASS/FAIL remains distinct from the candidate appointment status.
 */
export const COLLEGE_INTERVIEW_DETAIL_SECTIONS=[
 "Appointment","Interviewers","Candidate response","Feedback","History",
] as const;

/** Current durable delivery: in-app notification + activity in the same TX.
 * The old Spring afterCommit email/SMS fan-out has no equivalent outbound
 * provider/outbox in this service; report that gap, never claim email or SMS
 * delivery merely because the in-app transaction committed.
 */
export const COLLEGE_INTERVIEW_DELIVERY={
 inApp:"QUEUED_IN_TRANSACTION",email:"NOT_SENT",sms:"NOT_SENT",
} as const;

async function jobScope(context:RequestContext,rawJobId:unknown){
 const collegeId=await requireCollegePlacementAdmin(context),jobId=collegeDriveIdSchema.parse(rawJobId);
 const [job]=await getDb().select({
  id:placementJobs.id,title:placementJobs.title,status:placementJobs.status,
 }).from(placementJobs).where(and(eq(placementJobs.id,jobId),
  eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 return {collegeId,job};
}
export async function getCollegeInterviewAppointments(context:RequestContext,rawJobId:unknown){
 const {collegeId,job}=await jobScope(context,rawJobId);
 const storageReady=true; // Registered in drizzle/0124_college_interviews.sql
 const [rounds,candidates,interviews]=await Promise.all([
  getDb().select({id:placementJobRounds.id,name:placementJobRounds.name,
   status:placementJobRounds.status,kind:placementJobRounds.kind})
   .from(placementJobRounds).where(and(eq(placementJobRounds.jobId,job.id),
    eq(placementJobRounds.kind,"INTERVIEW"),ne(placementJobRounds.status,"CANCELLED")))
   .orderBy(asc(placementJobRounds.sequence)),
  getDb().select({applicationId:placementApplications.id,name:users.displayName,
   screening:placementApplicationScreenings.status})
   .from(placementApplications)
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,collegeId)))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .where(and(eq(placementApplications.jobId,job.id),eq(placementApplications.status,"SUBMITTED"),
    eq(placementApplicationScreenings.status,"SHORTLISTED")))
   .orderBy(asc(users.displayName)).limit(1000),
  storageReady?getDb().select().from(placementCollegeInterviews)
    .where(eq(placementCollegeInterviews.jobId,job.id))
    .orderBy(asc(placementCollegeInterviews.scheduledAt))
    .limit(2000):Promise.resolve([]),
 ]);
 return {job,storageReady,rounds,candidates,sectionOrder:COLLEGE_INTERVIEW_DETAIL_SECTIONS,
  delivery:COLLEGE_INTERVIEW_DELIVERY,interviews:interviews.map(row=>({
  ...row,panelLabel:row.interviewer,feedback:row.outcomeNote,
  scheduledAt:row.scheduledAt.toISOString(),createdAt:row.createdAt.toISOString(),
  updatedAt:row.updatedAt.toISOString(),
  completedAt:row.completedAt?.toISOString()??null,
  cancelledAt:row.cancelledAt?.toISOString()??null,
 }))};
}

export async function mutateCollegeInterview(context:RequestContext,rawJobId:unknown,raw:unknown){
 const {collegeId,job}=await jobScope(context,rawJobId);
 const input=collegeInterviewActionSchema.parse(raw);
 if(job.status!=="PUBLISHED")throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
 return getDb().transaction(async tx=>{
  const [lockedJob]=await tx.select({status:placementJobs.status}).from(placementJobs)
   .where(and(eq(placementJobs.id,job.id),eq(placementJobs.collegeId,collegeId))).for("share").limit(1);
  if(lockedJob?.status!=="PUBLISHED")throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
  let appointment:typeof placementCollegeInterviews.$inferSelect;
  let applicationId:string;
  let eventType:string;
  let message:string;
  if(input.action==="SCHEDULE"||input.action==="EDIT"){
   const proposed=input.appointment;
   if(new Date(proposed.scheduledAt)<=new Date())throw Error("Interview must be scheduled in the future.");
   const [round]=await tx.select({id:placementJobRounds.id,status:placementJobRounds.status})
    .from(placementJobRounds).where(and(eq(placementJobRounds.id,proposed.roundId),
     eq(placementJobRounds.jobId,job.id),eq(placementJobRounds.kind,"INTERVIEW"))).limit(1);
   if(!round||!["PENDING","SCHEDULED"].includes(round.status))
    throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_READY");
   const [application]=await tx.select({id:placementApplications.id})
    .from(placementApplications).innerJoin(placementApplicationScreenings,
     eq(placementApplicationScreenings.applicationId,placementApplications.id))
    .where(and(eq(placementApplications.id,proposed.applicationId),
     eq(placementApplications.jobId,job.id),eq(placementApplications.status,"SUBMITTED"),
     eq(placementApplicationScreenings.status,"SHORTLISTED"))).limit(1);
   if(!application)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
   const [withdrawal]=await tx.select({id:placementLearnerRequests.id})
    .from(placementLearnerRequests).where(and(
     eq(placementLearnerRequests.applicationId,proposed.applicationId),
     eq(placementLearnerRequests.requestType,"APPLICATION_WITHDRAWAL"),
     eq(placementLearnerRequests.status,"PENDING"))).limit(1);
   if(withdrawal)throw new PlacementsServiceError("PLACEMENT_REQUEST_PENDING_WITHDRAWAL");
   const start=new Date(proposed.scheduledAt);
   const end=new Date(start.getTime()+proposed.durationMinutes*60000);
   const sharedResource=or(
     proposed.mode==="ON_CAMPUS"&&proposed.venue?
      sql`lower(${placementCollegeInterviews.venue})=lower(${proposed.venue})`:undefined,
     proposed.interviewer?
      sql`lower(${placementCollegeInterviews.interviewer})=lower(${proposed.interviewer})`:undefined,
   );
   if(sharedResource){
    const collision=await tx.select({id:placementCollegeInterviews.id})
     .from(placementCollegeInterviews).where(and(
      eq(placementCollegeInterviews.jobId,job.id),
      eq(placementCollegeInterviews.status,"SCHEDULED"),
      input.action==="EDIT"?ne(placementCollegeInterviews.id,input.interviewId):undefined,
      sql`${placementCollegeInterviews.scheduledAt} < ${end}`,
      sql`${placementCollegeInterviews.scheduledAt} + ${placementCollegeInterviews.durationMinutes} * interval '1 minute' > ${start}`,
      sharedResource,
     )).limit(1);
    if(collision.length)throw Error("An interview already occupies this interviewer or venue at the chosen time.");
   }
   const values={
    roundId:proposed.roundId,applicationId:proposed.applicationId,
    scheduledAt:new Date(proposed.scheduledAt),durationMinutes:proposed.durationMinutes,
    mode:proposed.mode,venue:proposed.mode==="ON_CAMPUS"?proposed.venue:null,
    meetingUrl:proposed.mode==="VIRTUAL"?proposed.meetingUrl:null,
    interviewer:proposed.interviewer,updatedByUserId:context.user.id,updatedAt:new Date(),
   };
   if(input.action==="SCHEDULE"){
    const [saved]=await tx.insert(placementCollegeInterviews).values({
     ...values,jobId:job.id,createdByUserId:context.user.id,
    }).onConflictDoNothing().returning();
    if(!saved)throw Error("This candidate already has an active interview in the round.");
    appointment=saved;
    eventType="PLACEMENTS_COLLEGE_INTERVIEW_SCHEDULED";
    message="Interview scheduled for "+job.title+" at "+saved.scheduledAt.toISOString()+
     (saved.interviewer?" · Interviewers: "+saved.interviewer:"")+".";
   }else{
    const [old]=await tx.select().from(placementCollegeInterviews)
     .where(and(eq(placementCollegeInterviews.id,input.interviewId),
      eq(placementCollegeInterviews.jobId,job.id))).for("update").limit(1);
    if(!old||old.version!==input.expectedVersion||old.status!=="SCHEDULED")
     throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
    if(old.applicationId!==proposed.applicationId||old.roundId!==proposed.roundId)
     throw Error("Use a new appointment to change the student or interview round.");
    const [saved]=await tx.update(placementCollegeInterviews).set({...values,version:old.version+1})
     .where(and(eq(placementCollegeInterviews.id,old.id),
      eq(placementCollegeInterviews.version,old.version))).returning();
    if(!saved)throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
    appointment=saved;
    eventType="PLACEMENTS_COLLEGE_INTERVIEW_RESCHEDULED";
    message="Interview rescheduled for "+job.title+" to "+saved.scheduledAt.toISOString()+
     (saved.interviewer?" · Interviewers: "+saved.interviewer:"")+". "+input.reason;
   }
   applicationId=proposed.applicationId;
  }else{
   const [old]=await tx.select().from(placementCollegeInterviews).where(and(
    eq(placementCollegeInterviews.id,input.interviewId),eq(placementCollegeInterviews.jobId,job.id)))
    .for("update").limit(1);
   if(!old||old.version!==input.expectedVersion||old.status!=="SCHEDULED")
    throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
   if(input.action==="NO_SHOW"){
    const [withdrawal]=await tx.select({id:placementLearnerRequests.id})
     .from(placementLearnerRequests).where(and(
      eq(placementLearnerRequests.applicationId,old.applicationId),
      eq(placementLearnerRequests.requestType,"APPLICATION_WITHDRAWAL"),
      eq(placementLearnerRequests.status,"PENDING"))).limit(1);
    if(withdrawal)throw new PlacementsServiceError("PLACEMENT_REQUEST_PENDING_WITHDRAWAL");
   }
   const status=input.action==="CANCEL"?"CANCELLED":input.action;
   const [saved]=await tx.update(placementCollegeInterviews).set({
    status,version:old.version+1,outcomeNote:input.reason,
    updatedByUserId:context.user.id,updatedAt:new Date(),
    completedAt:status==="CANCELLED"?null:new Date(),
    cancelledAt:status==="CANCELLED"?new Date():null,
   }).where(and(eq(placementCollegeInterviews.id,old.id),
    eq(placementCollegeInterviews.version,old.version))).returning();
   if(!saved)throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
   appointment=saved;
   applicationId=old.applicationId;
   eventType="PLACEMENTS_COLLEGE_INTERVIEW_"+status;
   message="Your interview for "+job.title+" was "+status.toLowerCase().replaceAll("_"," ")+
    ". "+input.reason;
  }
  const [actor]=await tx.select({userId:collegeMemberships.userId})
   .from(placementApplications).innerJoin(collegeMemberships,
    eq(collegeMemberships.id,placementApplications.membershipId))
   .where(and(eq(placementApplications.id,applicationId),
    eq(placementApplications.jobId,job.id),eq(collegeMemberships.collegeId,collegeId))).limit(1);
  if(!actor)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
  const [audit]=await tx.insert(activityEvents).values({
   organizationId:context.membership!.organizationId,collegeId,
   actorUserId:context.user.id,actorMembershipId:context.membership!.id,
   module:"PLACEMENTS",eventType,subjectType:"placement_interview",subjectId:appointment.id,
   summary:message,metadata:{jobId:job.id,applicationId,roundId:appointment.roundId,
    status:appointment.status,interviewId:appointment.id},
  }).returning({id:activityEvents.id});
  await tx.insert(inAppNotifications).values({
   userId:actor.userId,eventId:audit.id,title:"Interview update",body:message,
   actionHref:"/learn/my-placements/interviews",
  }).onConflictDoNothing();
  return {id:appointment.id,status:appointment.status,version:appointment.version,
   interviewer:appointment.interviewer,venue:appointment.venue,
   delivery:COLLEGE_INTERVIEW_DELIVERY};
 });
}
