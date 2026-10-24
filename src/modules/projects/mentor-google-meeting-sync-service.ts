import "server-only";
import {and,eq,isNull} from "drizzle-orm";
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
  if(!["SCHEDULED","RESCHEDULED"].includes(meeting.status))
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
 const event=await mentorGoogleUpsertMeeting(accessToken,calendarId,{
  meetingId,title:meeting.title,agenda:meeting.agenda,
  startsAt:meeting.startsAt,endsAt:meeting.endsAt,
  timeZone:meeting.timeZone,inviteeEmails:invitees,
  ...(weeklyCount!==undefined?{weeklyCount}:{})
 });
 // Persist a provider-returned Meet link only if the meeting has not changed
 // since the scoped preflight. A conflicting write needs a fresh provider sync.
 const updates=await getDb().update(projectMeetings).set({
  ...(event.meetUrl?{meetingUrl:event.meetUrl}:{}),
  calendarSyncError:null,
  updatedAt:new Date(),
 }).where(and(
  eq(projectMeetings.id,meeting.id),
  eq(projectMeetings.projectId,scope.project.id),
  eq(projectMeetings.updatedAt,meeting.updatedAt),
  isNull(projectMeetings.deletedAt),
 )).returning({id:projectMeetings.id});
 if(updates.length!==1)
  throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
 const providerStatus=await readMentorGoogleMeetingStatus(accessToken,calendarId,meetingId);
 return {eventId:event.eventId,meetUrl:event.meetUrl,
  invitedRecipients:invitees.length,providerStatus};
}
