import "server-only";
import {and,eq,gt,inArray,isNull,lt,ne,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectMeetings,projectInstances,projectMembers,collegeMemberships,users}
 from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {ProjectsServiceError} from "./errors";
import {getMentorGoogleAccessToken} from "./mentor-google-calendar-connection-service";
import {mentorGoogleUpsertMeeting} from "./mentor-google-calendar-provider";
import {readMentorGoogleMeetingStatus} from "./mentor-google-calendar-status";
import {notifyActiveProjectMembers} from "./project-notification-service";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";

/** Every Google read/write is scoped to a live assigned Mentor, saved meeting
 * and its live same-college project roster. A client cannot supply invitees.
 */
async function verifiedGoogleMeeting(context:RequestContext,projectId:string,meetingId:string){
 if(!z.uuid().safeParse(meetingId).success)
  throw new ProjectsServiceError("PROJECT_MEETING_NOT_FOUND");
 const scope=await requireProjectReadAccess(context,projectId);
 if(scope.access!=="MENTOR")throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({
   status:projectInstances.status,deletedAt:projectInstances.deletedAt,
  }).from(projectInstances).where(and(
   eq(projectInstances.id,scope.project.id),
   eq(projectInstances.collegeId,scope.collegeId),
  )).for("update").limit(1);
  if(!project||project.deletedAt||project.status!=="ACTIVE")
   throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  await assertPersistedProjectMutationActor(tx,context,scope);
  const [meeting]=await tx.select({
   id:projectMeetings.id,title:projectMeetings.title,agenda:projectMeetings.agenda,
   startsAt:projectMeetings.startsAt,endsAt:projectMeetings.endsAt,
   timeZone:projectMeetings.timeZone,status:projectMeetings.status,
   deletedAt:projectMeetings.deletedAt,updatedAt:projectMeetings.updatedAt,
   meetingUrl:projectMeetings.meetingUrl,
  }).from(projectMeetings).where(and(
   eq(projectMeetings.id,meetingId),
   eq(projectMeetings.projectId,scope.project.id),
  )).for("update").limit(1);
  if(!meeting||meeting.deletedAt)
   throw new ProjectsServiceError("PROJECT_MEETING_NOT_FOUND");
  if(!["DRAFT","SCHEDULED","RESCHEDULED"].includes(meeting.status))
   throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  const people=await tx.select({email:users.email}).from(projectMembers)
   .innerJoin(collegeMemberships,and(
     eq(collegeMemberships.id,projectMembers.membershipId),
     eq(collegeMemberships.collegeId,scope.collegeId),
     eq(collegeMemberships.status,"ACTIVE"),
   ))
   .innerJoin(users,and(
     eq(users.id,collegeMemberships.userId),
     eq(users.platformStatus,"ACTIVE"),
   )).where(and(
     eq(projectMembers.projectId,scope.project.id),
     isNull(projectMembers.endedAt),
   ));
  const invitees=[...new Set(people.flatMap(person=>person.email?
    [person.email.trim().toLowerCase()]:[]))].filter(Boolean);
  return {scope,meeting,invitees};
 });
}
export async function checkMentorGoogleMeeting(
 context:RequestContext,projectId:string,meetingId:string,
){
 await verifiedGoogleMeeting(context,projectId,meetingId);
 const {accessToken,calendarId}=await getMentorGoogleAccessToken(context);
 return readMentorGoogleMeetingStatus(accessToken,calendarId,meetingId);
}
export async function syncMentorGoogleMeeting(
 context:RequestContext,projectId:string,meetingId:string,weeklyCount?:number,
){
 if(weeklyCount!==undefined&&(!Number.isSafeInteger(weeklyCount)||
    weeklyCount<2||weeklyCount>52))
  throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
 const {scope,meeting,invitees}=await verifiedGoogleMeeting(context,projectId,meetingId);
 if(meeting.startsAt.getTime()<=Date.now())
  throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
 const {accessToken,calendarId}=await getMentorGoogleAccessToken(context);
 const draft=meeting.status==="DRAFT";
 // Draft first obtains a private Meet URL without issuing invitations.
 const event=await mentorGoogleUpsertMeeting(accessToken,calendarId,{
  meetingId,title:meeting.title,agenda:meeting.agenda,
  startsAt:meeting.startsAt,endsAt:meeting.endsAt,
  timeZone:meeting.timeZone,inviteeEmails:draft?[]:invitees,
  ...(weeklyCount!==undefined?{weeklyCount}:{})
 });
 if(draft&&!event.meetUrl){
  // Google conference creation may be pending. The meeting remains DRAFT,
  // and no external invitations were requested. Repeated sync is idempotent.
  return {eventId:event.eventId,meetUrl:null,invitedRecipients:0,
   meetingScheduled:false,invitationStatus:"NOT_SENT" as const,providerStatus:null};
 }
 // Google I/O occurred outside the transaction. Reacquire persisted auth
 // and serialize the final promotion against ordinary meeting scheduling.
 await getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status,
   deletedAt:projectInstances.deletedAt}).from(projectInstances).where(and(
    eq(projectInstances.id,scope.project.id),
    eq(projectInstances.collegeId,scope.collegeId),
  )).for("update").limit(1);
  if(!project||project.deletedAt||project.status!=="ACTIVE")
   throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  await assertPersistedProjectMutationActor(tx,context,scope);
  const [current]=await tx.select({status:projectMeetings.status,
   deletedAt:projectMeetings.deletedAt,updatedAt:projectMeetings.updatedAt})
   .from(projectMeetings).where(and(eq(projectMeetings.id,meeting.id),
    eq(projectMeetings.projectId,scope.project.id))).for("update").limit(1);
  if(!current||current.deletedAt||current.status!==meeting.status||
     current.updatedAt.getTime()!==meeting.updatedAt.getTime())
   throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
  if(meeting.startsAt.getTime()<=Date.now())
   throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  if(draft){
   if(!context.membership||context.membership.collegeId!==scope.collegeId)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
   const [overlap]=await tx.select({id:projectMeetings.id})
    .from(projectMeetings).where(and(
     or(eq(projectMeetings.projectId,scope.project.id),
       eq(projectMeetings.scheduledByUserId,context.user.id)),
     ne(projectMeetings.id,meeting.id),
     inArray(projectMeetings.status,["SCHEDULED","RESCHEDULED"]),
     isNull(projectMeetings.deletedAt),
     lt(projectMeetings.startsAt,meeting.endsAt),
     gt(projectMeetings.endsAt,meeting.startsAt),
    )).limit(1);
   if(overlap)throw new ProjectsServiceError("PROJECT_MEETING_SCHEDULE_CONFLICT");
  }
  const updatedAt=new Date(Math.max(Date.now(),meeting.updatedAt.getTime()+1));
  const [updated]=await tx.update(projectMeetings).set({
   ...(draft?{status:"SCHEDULED",meetingUrl:event.meetUrl!,
     scheduledByUserId:context.user.id,
     scheduledByMembershipId:context.membership!.id}:
     event.meetUrl?{meetingUrl:event.meetUrl}:{}),
   calendarSyncError:null,updatedAt,
  }).where(and(
   eq(projectMeetings.id,meeting.id),
   eq(projectMeetings.projectId,scope.project.id),
   eq(projectMeetings.status,meeting.status),
   isNull(projectMeetings.deletedAt),
   sql`date_trunc('milliseconds', ${projectMeetings.updatedAt}) = ${meeting.updatedAt.toISOString()}::timestamptz`,
  )).returning({id:projectMeetings.id});
  if(!updated)throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
  if(draft){
   const activity=await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED,
    collegeId:scope.collegeId,organizationId:scope.organizationId,
    subjectType:"project_meeting",subjectId:meeting.id,subjectLabel:meeting.title,
    summary:"Project meeting scheduled through Google Meet",
    metadata:{projectId:scope.project.id,meetingId:meeting.id,
     previousStatus:"DRAFT",status:"SCHEDULED",provider:"GOOGLE"},
    groupKey:"project:"+scope.project.id+":meetings",
   });
   await notifyActiveProjectMembers(tx,activity.id,{
    projectId:scope.project.id,collegeId:scope.collegeId,roles:["LEARNER"],
    exceptUserId:context.user.id,title:"Project meeting scheduled",
    body:"Open the project meeting for the verified Google Meet link.",
    actionHref:"/learn/projects/"+scope.project.id+"?tab=meetings",
   });
   await notifyActiveProjectMembers(tx,activity.id,{
    projectId:scope.project.id,collegeId:scope.collegeId,roles:["MENTOR"],
    exceptUserId:context.user.id,title:"Project meeting scheduled",
    body:"A project meeting was scheduled through Google Meet.",
    actionHref:"/mentor/projects/"+scope.project.id+"?tab=meetings",
   });
  }
 });
 // Draft creation intentionally had zero attendees. Once the verified link
 // is durably saved, explicitly update the SAME provider event and invite
 // the authorised roster. Failure leaves a retryable state, never a false
 // claim that Google sent invitations.
 let invitationStatus:"PROVIDER_ACCEPTED"|"RETRY_REQUIRED"="PROVIDER_ACCEPTED";
 if(draft){
  try{
   await mentorGoogleUpsertMeeting(accessToken,calendarId,{
    meetingId,title:meeting.title,agenda:meeting.agenda,
    startsAt:meeting.startsAt,endsAt:meeting.endsAt,
    timeZone:meeting.timeZone,inviteeEmails:invitees,
    ...(weeklyCount!==undefined?{weeklyCount}:{})
   });
  }catch{invitationStatus="RETRY_REQUIRED";}
 }
 const providerStatus=await readMentorGoogleMeetingStatus(
  accessToken,calendarId,meetingId).catch(()=>null);
 return {eventId:event.eventId,meetUrl:event.meetUrl,
  invitedRecipients:invitationStatus==="PROVIDER_ACCEPTED"?invitees.length:0,
  meetingScheduled:true,invitationStatus,providerStatus};
}
