import "server-only";
import {and,desc,eq,inArray,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,projectInstances,projectMeetings,
 projectMembers,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {requireProjectReadAccess} from "./access";
import {assertPersistedLearnerProjectMutation} from "./learner-mutation-guard";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {notifyActiveProjectMembers} from "./project-notification-service";
import {ProjectsServiceError} from "./errors";

export const mentorMeetingRsvpSchema=z.strictObject({
 response:z.enum(["ACCEPTED","DECLINED","TENTATIVE"]),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
});
export type MentorMeetingRsvpResponse=z.infer<typeof mentorMeetingRsvpSchema>["response"];
export type MentorMeetingRsvpFact={
 meetingId:string;activeInvitees:number;accepted:number;declined:number;
 tentative:number;notRecorded:number;myResponse:MentorMeetingRsvpResponse|null;
};
/** An in-app attendee response is NOT an external Google Calendar RSVP. */
export async function respondToProjectMeeting(
 context:RequestContext,projectId:string,meetingId:string,raw:unknown,
):Promise<{response:MentorMeetingRsvpResponse;changed:boolean}>{
 const input=mentorMeetingRsvpSchema.parse(raw);
 if(!z.uuid().safeParse(meetingId).success)
  throw new ProjectsServiceError("PROJECT_MEETING_NOT_FOUND");
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
  throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
 const scope=await requireProjectReadAccess(context,projectId);
 if((scope.access!=="MENTOR"&&scope.access!=="LEARNER")||
  !context.membership||context.user.platformStatus!=="ACTIVE")
  throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({
   status:projectInstances.status,deletedAt:projectInstances.deletedAt,
  }).from(projectInstances).where(and(eq(projectInstances.id,scope.project.id),
   eq(projectInstances.collegeId,scope.collegeId))).for("update").limit(1);
  if(!project||project.deletedAt||["ARCHIVED","COMPLETED"].includes(project.status))
   throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  if(scope.access==="MENTOR")await assertPersistedProjectMutationActor(tx,context,scope);
  else await assertPersistedLearnerProjectMutation(tx,context,scope.project.id,scope.collegeId);
  const [meeting]=await tx.select({
   id:projectMeetings.id,status:projectMeetings.status,
   deletedAt:projectMeetings.deletedAt,startsAt:projectMeetings.startsAt,
   updatedAt:projectMeetings.updatedAt,title:projectMeetings.title,
  }).from(projectMeetings).where(and(eq(projectMeetings.id,meetingId),
   eq(projectMeetings.projectId,scope.project.id))).for("update").limit(1);
  if(!meeting||meeting.deletedAt)
   throw new ProjectsServiceError("PROJECT_MEETING_NOT_FOUND");
  if(!["SCHEDULED","RESCHEDULED"].includes(meeting.status)||
    meeting.startsAt.getTime()<=Date.now())
   throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  if(meeting.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
   throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
  const [prior]=await tx.select({metadata:activityEvents.metadata})
   .from(activityEvents).where(and(
     eq(activityEvents.collegeId,scope.collegeId),
     eq(activityEvents.actorUserId,context.user.id),
     eq(activityEvents.subjectId,meetingId),
     eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_RSVP),
   )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
  if(prior?.metadata?.["response"]===input.response)
   return {response:input.response,changed:false};
  const event=await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_RSVP,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project_meeting",subjectId:meetingId,subjectLabel:meeting.title,
   summary:"Project meeting RSVP recorded",
   metadata:{projectId:scope.project.id,meetingId,
    membershipId:context.membership!.id,response:input.response},
   groupKey:"project:"+scope.project.id+":meetings",
  });
  await notifyActiveProjectMembers(tx,event.id,{
   projectId:scope.project.id,collegeId:scope.collegeId,
   roles:["MENTOR"],exceptUserId:context.user.id,
   title:"Meeting response updated",
   body:"An in-app attendee response was recorded for "+meeting.title+".",
   actionHref:"/mentor/projects/"+scope.project.id+"?tab=team#project-meetings",
  });
  return {response:input.response,changed:true};
 });
}
/** Read actual saved in-app responses from active project members only.
 * A missing RSVP stays unknown; reading an in-app notice is not attendance.
 */
export async function listProjectMeetingRsvpFacts(
 context:RequestContext,projectId:string,
 meetingIds:readonly string[],
):Promise<MentorMeetingRsvpFact[]>{
 if(!meetingIds.length)return [];
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
  throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
 const scope=await requireProjectReadAccess(context,projectId);
 if(!["MENTOR","LEARNER","ADMIN"].includes(scope.access))
  throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
 const unique=[...new Set(meetingIds)].slice(0,100);
 if(unique.some(id=>!z.uuid().safeParse(id).success))
  throw new ProjectsServiceError("PROJECT_MEETING_NOT_FOUND");
 const db=getDb();
 const actual=await db.select({id:projectMeetings.id})
  .from(projectMeetings).where(and(
   eq(projectMeetings.projectId,scope.project.id),
   inArray(projectMeetings.id,unique),isNull(projectMeetings.deletedAt),
  ));
 const valid=new Set(actual.map(row=>row.id));
 if(!valid.size)return [];
 const active=await db.select({userId:users.id})
  .from(projectMembers)
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,projectMembers.membershipId),
   eq(collegeMemberships.collegeId,scope.collegeId),
   eq(collegeMemberships.status,"ACTIVE"),
  ))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
   eq(users.platformStatus,"ACTIVE")))
  .where(and(eq(projectMembers.projectId,scope.project.id),
   isNull(projectMembers.endedAt),inArray(projectMembers.role,["LEARNER","MENTOR"])));
 const attendees=new Set(active.map(x=>x.userId));
 const events=await db.select({meetingId:activityEvents.subjectId,
  actorUserId:activityEvents.actorUserId,metadata:activityEvents.metadata,
 }).from(activityEvents).where(and(
  eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_RSVP),
  eq(activityEvents.collegeId,scope.collegeId),
  inArray(activityEvents.subjectId,[...valid]),
 )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(3000);
 const latest=new Map<string,MentorMeetingRsvpResponse>();
 for(const event of events){
  if(!event.actorUserId||!attendees.has(event.actorUserId))continue;
  const response=event.metadata?.["response"];
  if(response!=="ACCEPTED"&&response!=="DECLINED"&&response!=="TENTATIVE")continue;
  const key=event.meetingId+":"+event.actorUserId;
  if(!latest.has(key))latest.set(key,response);
 }
 return [...valid].map(meetingId=>{
  let accepted=0,declined=0,tentative=0;
  for(const userId of attendees){
   const value=latest.get(meetingId+":"+userId);
   if(value==="ACCEPTED")accepted++;
   if(value==="DECLINED")declined++;
   if(value==="TENTATIVE")tentative++;
  }
  return {meetingId,activeInvitees:attendees.size,accepted,declined,tentative,
   notRecorded:Math.max(0,attendees.size-accepted-declined-tentative),
   myResponse:latest.get(meetingId+":"+context.user.id)??null};
 });
}
