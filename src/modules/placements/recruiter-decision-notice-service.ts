import "server-only";
import {and,desc,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {listOwnRecruiterDriveRequests} from "./recruiter-drive-request-service";
import {recruiterDecisionNoticeRows} from "./recruiter-decision-notice-model";
/** REC-calendar-messages-profile-22: own REQUEST/SENT_BACK/DRAFT/REJECTED
 * decisions appear in the recruiter notification feed. No TPO internals or
 * colleague requests are selected. */
export async function listOwnRecruiterDecisionNotices(context:RequestContext,collegeId:string){
 const requests=await listOwnRecruiterDriveRequests(context,collegeId);
 const ownIds=requests.map(r=>r.id);
 if(ownIds.length===0)return [];
 const rows=await getDb().select({
  id:inAppNotifications.id,
  title:inAppNotifications.title,body:inAppNotifications.body,
  createdAt:inAppNotifications.createdAt,readAt:inAppNotifications.readAt,
  subjectId:activityEvents.subjectId,
 }).from(inAppNotifications)
  .innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
  .where(and(eq(inAppNotifications.userId,context.user.id),
    eq(activityEvents.collegeId,collegeId),
    eq(activityEvents.subjectType,"recruiter_drive_request"),
    eq(activityEvents.eventType,"RECRUITER_DRIVE_REQUEST_DECIDED"),
    inArray(activityEvents.subjectId,ownIds)))
  .orderBy(desc(inAppNotifications.createdAt),desc(inAppNotifications.id))
  .limit(50);
 return recruiterDecisionNoticeRows(rows,collegeId);
}
