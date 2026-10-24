import "server-only";
import {and,desc,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications} from "@/db/schema";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {mentorMeetingInAppNoticeFacts} from "./mentor-meeting-in-app-notice-model";

/** Authorized Mentor-only projection. Notifications are counted, never
 * returned with user IDs, and may include people since removed from roster.
 */
export async function getMentorMeetingNoticeFacts(
 context:RequestContext,projectId:string,meetingIds:readonly string[],
){
 const scope=await requireProjectReadAccess(context,projectId);
 if(scope.access!=="MENTOR")throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 if(!meetingIds.length)return [];
 const events=await getDb().select({
   id:activityEvents.id,subjectId:activityEvents.subjectId,
   occurredAt:activityEvents.occurredAt,metadata:activityEvents.metadata,
 }).from(activityEvents).where(and(
   eq(activityEvents.module,"PROJECTS"),
   eq(activityEvents.subjectType,"project_meeting"),
   eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED),
   eq(activityEvents.collegeId,scope.collegeId),
   eq(activityEvents.organizationId,scope.organizationId),
   eq(activityEvents.groupKey,"project:"+scope.project.id+":meetings"),
   inArray(activityEvents.subjectId,[...new Set(meetingIds)]),
 )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id));
 if(!events.length)return [];
 // Count in-app inbox rows for only this project's already-authorized
 // announcement events. These are durable local notifications, not
 // recipient replies or external delivery acknowledgements.
 const rows=await getDb().select({
   eventId:inAppNotifications.eventId,
   total:sql<number>`count(distinct ${inAppNotifications.userId})::int`,
 }).from(inAppNotifications).where(
   inArray(inAppNotifications.eventId,events.map(row=>row.id))
 ).groupBy(inAppNotifications.eventId);
 return mentorMeetingInAppNoticeFacts(events,
   new Map(rows.map(row=>[row.eventId,row.total])),scope.project.id);
}
