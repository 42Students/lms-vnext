import "server-only";
import {and,desc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePersistedMentorInboxMembership}
 from "@/modules/activity/mentor-notifications-service";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {ProjectsServiceError} from "./errors";
import {mentorEmailPreferenceFromSavedEvent,mentorEmailPreferenceSaveSchema}
 from "./mentor-email-preference-model";

const eventType=ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_EMAIL_PREFERENCE_CHANGED;
const subjectType="mentor_email_preference";
const preferenceFilter=(userId:string,collegeId:string)=>and(
 eq(activityEvents.actorUserId,userId),
 eq(activityEvents.collegeId,collegeId),
 eq(activityEvents.eventType,eventType),
 eq(activityEvents.subjectType,subjectType),
 eq(activityEvents.subjectId,userId),
);
async function permitted(context:RequestContext){
 const membership=await requirePersistedMentorInboxMembership(context);
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 return membership;
}
/** No implicit opt-in. The latest durable user+college event is authoritative.
 * UUID event identity is the optimistic version, not a lossy timestamp.
 */
export async function getMentorEmailPreference(context:RequestContext){
 const membership=await permitted(context);
 const [event]=await getDb().select({id:activityEvents.id,
  metadata:activityEvents.metadata}).from(activityEvents).where(
   preferenceFilter(context.user.id,membership.collegeId))
  .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
 return mentorEmailPreferenceFromSavedEvent(event);
}

/** Serialise first writes and later edits under one principal-bound lock.
 * Reconstruct the live persisted Mentor role while inside the transaction,
 * then write an immutable audit receipt; never accept a client identity.
 */
export async function saveMentorEmailPreference(context:RequestContext,raw:unknown){
 const input=mentorEmailPreferenceSaveSchema.parse(raw);
 const membership=await permitted(context);
 return getDb().transaction(async tx=>{
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${context.user.id+":"+membership.collegeId}, 53))`);
  const actor=await assertPersistedPlatformPermission(tx,context,"projects.read",{
   collegeId:membership.collegeId,organizationId:membership.organizationId,
  });
  if(!hasMembershipRole(actor,"MENTOR"))
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const [current]=await tx.select({id:activityEvents.id,
   metadata:activityEvents.metadata}).from(activityEvents).where(
    preferenceFilter(context.user.id,membership.collegeId))
   .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
  const saved=mentorEmailPreferenceFromSavedEvent(current);
  if(saved.version!==input.expectedVersion)
   throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
  if(saved.version&&saved.enabled===input.enabled)
   return saved;
  const event=await recordActivityEventInTransaction(tx,actor,{
   eventType,collegeId:membership.collegeId,
   organizationId:membership.organizationId,
   subjectType,subjectId:context.user.id,
   summary:"Mentor updated project email preferences",
   metadata:{enabled:input.enabled,
    permittedKinds:["FINAL_SUBMISSION","MEETING_REQUEST"]},
   groupKey:"mentor:email-preference:"+context.user.id,
  });
  return {enabled:input.enabled,version:event.id};
 });
}
