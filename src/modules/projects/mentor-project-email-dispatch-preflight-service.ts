import "server-only";
import {and,desc,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges,collegeMemberships,membershipRoles,
 projectInstances,projectMembers,projectMeetings,projectSubmissions,users}
 from "@/db/schema";
import {mentorEmailPreferenceFromSavedEvent} from "./mentor-email-preference-model";
import {classifyMentorProjectEmailSource,mentorProjectEmailSubmissionIsNotifiable,
 mentorEmailQueueMatchesSource,type MentorQueuedEmailScope}
 from "./mentor-project-email-event-model";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {MentorProjectEmailDispatch} from "./mentor-project-email-provider";

/** An internal, read-only pre-send security boundary for a future claimed
 * email worker. NOT an HTTP endpoint and NOT an outbox/dispatch side effect.
 * Identity, recipient address, event, tenant and saved consent all come
 * exclusively from current PostgreSQL rows. Queue claims must match the
 * originating source event, tenant, project and allowed event category.
 */
export async function resolveMentorProjectEmailPreflight(
 sourceEventId:string,recipientUserId:string,queuedScope:MentorQueuedEmailScope,
):Promise<MentorProjectEmailDispatch|null>{
 if(!z.uuid().safeParse(sourceEventId).success||
    !z.uuid().safeParse(recipientUserId).success)return null;
 const db=getDb();
 const [event]=await db.select({
  id:activityEvents.id,module:activityEvents.module,
  eventType:activityEvents.eventType,subjectType:activityEvents.subjectType,
  subjectId:activityEvents.subjectId,metadata:activityEvents.metadata,
  collegeId:activityEvents.collegeId,
  organizationId:activityEvents.organizationId,
 }).from(activityEvents).where(eq(activityEvents.id,sourceEventId)).limit(1);
 if(!event||event.module!=="PROJECTS"||!event.collegeId||!event.organizationId)
  return null;
 const source=classifyMentorProjectEmailSource(event);
 if(!source||!mentorEmailQueueMatchesSource(queuedScope,{
  collegeId:event.collegeId,organizationId:event.organizationId,
  projectId:source.projectId,kind:source.kind,
 }))return null;
 const [project]=await db.select({
  id:projectInstances.id,title:projectInstances.title,
  deletedAt:projectInstances.deletedAt,
 }).from(projectInstances).where(and(
  eq(projectInstances.id,source.projectId),
  eq(projectInstances.collegeId,event.collegeId),
 )).limit(1);
 if(!project||project.deletedAt)return null;
 const [college]=await db.select({name:colleges.name})
  .from(colleges).where(and(
   eq(colleges.id,event.collegeId),
   eq(colleges.organizationId,event.organizationId),
   eq(colleges.status,"ACTIVE"),
  )).limit(1);
 if(!college)return null;
 // A submitted event must still point to its own real project submission;
 // a meeting request must still be waiting for response in this project.
 if(source.kind==="FINAL_SUBMISSION"){
  const [submitted]=await db.select({
   id:projectSubmissions.id,status:projectSubmissions.status,
   deletedAt:projectSubmissions.deletedAt,
   submittedAt:projectSubmissions.submittedAt,
  }).from(projectSubmissions).where(and(
    eq(projectSubmissions.id,event.subjectId),
    eq(projectSubmissions.projectId,project.id),
   )).limit(1);
  if(!mentorProjectEmailSubmissionIsNotifiable(submitted??null))return null;
 }else{
  const [requested]=await db.select({id:projectMeetings.id})
   .from(projectMeetings).where(and(
    eq(projectMeetings.id,event.subjectId),
    eq(projectMeetings.projectId,project.id),
    eq(projectMeetings.status,"REQUESTED"),
    isNull(projectMeetings.deletedAt),
   )).limit(1);
  if(!requested)return null;
 }
 const [recipient]=await db.select({
  userId:users.id,email:users.email,name:users.displayName,
 }).from(projectMembers)
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,projectMembers.membershipId),
   eq(collegeMemberships.collegeId,event.collegeId),
   eq(collegeMemberships.userId,recipientUserId),
   eq(collegeMemberships.status,"ACTIVE"),
  ))
  .innerJoin(users,and(
   eq(users.id,collegeMemberships.userId),
   eq(users.platformStatus,"ACTIVE"),
  ))
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"MENTOR"),
  ))
  .where(and(
   eq(projectMembers.projectId,project.id),
   eq(projectMembers.role,"MENTOR"),
   isNull(projectMembers.endedAt),
  )).limit(1);
 if(!recipient||!recipient.email)return null;
 const [saved]=await db.select({id:activityEvents.id,
  metadata:activityEvents.metadata}).from(activityEvents)
  .where(and(
   eq(activityEvents.actorUserId,recipient.userId),
   eq(activityEvents.collegeId,event.collegeId),
   eq(activityEvents.eventType,
    ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_EMAIL_PREFERENCE_CHANGED),
   eq(activityEvents.subjectType,"mentor_email_preference"),
   eq(activityEvents.subjectId,recipient.userId),
  )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
 if(!mentorEmailPreferenceFromSavedEvent(saved).enabled)return null;
 // This result may be used only immediately before provider send by a
 // durable, idempotently claimed worker. It is not a delivery receipt.
 return {sourceEventId:event.id,recipientUserId:recipient.userId,
  recipientEmail:recipient.email,recipientName:recipient.name??"Mentor",
  projectTitle:project.title,collegeName:college.name,
  kind:source.kind,savedOptIn:true};
}
