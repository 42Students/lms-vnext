import "server-only";
import {and,asc,desc,eq,inArray,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,membershipRoles,projectMembers,users}
 from "@/db/schema";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {MentorProjectEmailKind} from "./mentor-project-email-provider";
import {mentorEmailPreferenceFromSavedEvent} from "./mentor-email-preference-model";

type Writer=Pick<ReturnType<typeof getDb>,"select"|"selectDistinctOn"|"insert">;
type Params={
 sourceEventId:string;projectId:string;collegeId:string;
 organizationId:string;kind:MentorProjectEmailKind;excludeUserId:string;
};
/** Only the two audited producer transactions call this function. It never
 * performs a provider request, and all queued jobs commit/rollback with the
 * canonical business event. No email address or body is stored in the queue.
 *
 * Provisioning is deliberately opt-in at the OPERATIONS level as well.
 * Old submissions cannot suddenly email everybody after rollout.
 */
export async function queueMentorProjectEmailIntent(
 tx:Writer,input:Params,
):Promise<number>{
 if(process.env["MENTOR_PROJECT_EMAIL_OUTBOX_READY"]!=="verified")return 0;
 const recipients=await tx.select({userId:users.id})
  .from(projectMembers)
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,projectMembers.membershipId),
   eq(collegeMemberships.collegeId,input.collegeId),
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
  .where(and(eq(projectMembers.projectId,input.projectId),
   eq(projectMembers.role,"MENTOR"),isNull(projectMembers.endedAt)));
 const ids=[...new Set(recipients.map(row=>row.userId))]
  .filter(id=>id!==input.excludeUserId);
 if(!ids.length)return 0;
 // DISTINCT ON retains only each recipient's latest immutable preference.
 // The implicit default is off, including a malformed or absent receipt.
 const preferences=await tx.selectDistinctOn([activityEvents.actorUserId],{
   recipientId:activityEvents.actorUserId,
   id:activityEvents.id,metadata:activityEvents.metadata,
  }).from(activityEvents).where(and(
   inArray(activityEvents.actorUserId,ids),
   eq(activityEvents.collegeId,input.collegeId),
   eq(activityEvents.eventType,
    ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_EMAIL_PREFERENCE_CHANGED),
   eq(activityEvents.subjectType,"mentor_email_preference"),
  )).orderBy(asc(activityEvents.actorUserId),
    desc(activityEvents.occurredAt),desc(activityEvents.id));
 const optedIn=new Set(preferences.filter(row=>row.recipientId &&
   mentorEmailPreferenceFromSavedEvent(row).enabled)
   .map(row=>row.recipientId!));
 const eligible=ids.filter(id=>optedIn.has(id));
 if(!eligible.length)return 0;
 await tx.insert(activityEvents).values(eligible.map(recipientUserId=>({
  organizationId:input.organizationId,collegeId:input.collegeId,
  module:"PROJECTS",eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_EMAIL_QUEUED,
  subjectType:"mentor_project_email_job",subjectId:input.sourceEventId,
  summary:"Opted-in Mentor project email queued for provider dispatch",
  metadata:{sourceEventId:input.sourceEventId,recipientUserId,
   kind:input.kind,projectId:input.projectId},
  groupKey:"project:"+input.projectId+":emails",
  dedupeKey:"mentor-email:"+input.sourceEventId+":"+recipientUserId,
 }))).onConflictDoNothing();
 return eligible.length;
}
