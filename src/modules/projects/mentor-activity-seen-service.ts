import "server-only";
import {and,desc,eq,gt,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {requirePersistedMentorInboxMembership} from
 "@/modules/activity/mentor-notifications-service";
import type {RequestContext} from "@/modules/identity/context";

const MARKER_TYPE="mentor_project_activity_seen";
const MARKER_EVENT=ACTIVITY_EVENT_TYPES.IDENTITY_MENTOR_NOTIFICATION_ACKNOWLEDGED;

/** A recipient-specific, persisted high-water timestamp. The count is a DB
 * aggregate over every accessible project event (not only the loaded page).
 * First visits have no baseline; never call historical items 'new' by default.
 */
export async function getMentorProjectActivitySeenState(
 context:RequestContext,projectId:string,
):Promise<{lastSeenAt:string|null;newCount:number|null}>{
 const membership=await requirePersistedMentorInboxMembership(context);
 const scope=await requireProjectReadAccess(context,projectId);
 if(scope.access!=="MENTOR"||scope.collegeId!==membership.collegeId)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const [receipt]=await getDb().select({occurredAt:activityEvents.occurredAt})
  .from(activityEvents).where(and(
   eq(activityEvents.actorUserId,context.user.id),
   eq(activityEvents.collegeId,scope.collegeId),
   eq(activityEvents.organizationId,scope.organizationId),
   eq(activityEvents.subjectType,MARKER_TYPE),
   eq(activityEvents.subjectId,scope.project.id),
   eq(activityEvents.eventType,MARKER_EVENT),
  )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
 if(!receipt)return {lastSeenAt:null,newCount:null};
 const [count]=await getDb().select({
  total:sql<number>`count(*)::int`,
 }).from(activityEvents).where(and(
  eq(activityEvents.module,"PROJECTS"),
  eq(activityEvents.collegeId,scope.collegeId),
  eq(activityEvents.organizationId,scope.organizationId),
  gt(activityEvents.occurredAt,receipt.occurredAt),
  or(
   and(or(eq(activityEvents.subjectType,"project"),
       eq(activityEvents.subjectType,"project_instance")),
     eq(activityEvents.subjectId,scope.project.id)),
   sql`${activityEvents.metadata} ->> 'projectId' = ${scope.project.id}`,
   scope.project.legacyProjectId!==null?
     eq(activityEvents.legacyProjectId,scope.project.legacyProjectId):undefined,
  ),
 ));
 return {lastSeenAt:receipt.occurredAt.toISOString(),
  newCount:Number(count?.total??0)};
}

/** Writes an explicit server-time 'seen' marker. Revalidates recipient
 * membership and project scope; never accepts a client-supplied timestamp.
 */
export async function markMentorProjectActivitySeen(
 context:RequestContext,projectId:string,
):Promise<{lastSeenAt:string}>{
 const membership=await requirePersistedMentorInboxMembership(context);
 const scope=await requireProjectReadAccess(context,projectId);
 if(scope.access!=="MENTOR"||scope.collegeId!==membership.collegeId)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const marker=await getDb().transaction(async tx=>{
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${context.user.id}, 37))`);
  return recordActivityEventInTransaction(tx,context,{
   eventType:MARKER_EVENT,collegeId:scope.collegeId,
   organizationId:scope.organizationId,
   subjectType:MARKER_TYPE,subjectId:scope.project.id,
   subjectLabel:scope.project.title,
   summary:"Mentor project activity marked seen",
   metadata:{projectId:scope.project.id,source:"MENTOR_ACTIVITY"},
   groupKey:"mentor:activity:"+context.user.id,
  });
 });
 return {lastSeenAt:marker.occurredAt.toISOString()};
}
