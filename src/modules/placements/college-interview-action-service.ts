import "server-only";
import {and,asc,eq,ne} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,placementApplications,
 placementApplicationScreenings,placementJobRounds,placementJobs,placementLearnerRequests,users} from "@/db/schema";
import {placementCollegeInterviews} from "@/db/schema/placement-college-interviews";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {collegeDriveIdSchema} from "./college-drive-read-model";
import {collegeInterviewActionSchema} from "./college-interview-action-model";
import {placementTableExists} from "./staged-tables";

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
 const storageReady=await placementTableExists("placement_college_interviews");
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
 return {job,storageReady,rounds,candidates,interviews:interviews.map(row=>({
  ...row,scheduledAt:row.scheduledAt.toISOString(),createdAt:row.createdAt.toISOString(),
  updatedAt:row.updatedAt.toISOString(),
  completedAt:row.completedAt?.toISOString()??null,
  cancelledAt:row.cancelledAt?.toISOString()??null,
 }))};
}

export async function mutateCollegeInterview(context:RequestContext,rawJobId:unknown,raw:unknown){
 const {collegeId,job}=await jobScope(context,rawJobId);
 if(!await placementTableExists("placement_college_interviews"))
  throw Error("Candidate interview storage has not been registered.");
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
    message="Interview scheduled for "+job.title+" at "+saved.scheduledAt.toISOString()+".";
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
     ". "+input.reason;
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
  return {id:appointment.id,status:appointment.status,version:appointment.version};
 });
}
