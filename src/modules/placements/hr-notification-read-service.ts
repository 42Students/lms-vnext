import "server-only";
import {and,eq,inArray,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {inAppNotifications,activityEvents} from "@/db/schema";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {listOwnRecruiterPlacementJobs} from "./recruiter-service";
import {HR_NOTIFICATION_EVENTS} from "./hr-notifications-model";
import {hrNotificationReadSchema,hrNotificationVersionMatches,ownsHrNotificationActor} from "./hr-notification-read-model";
export async function markHrNotificationRead(
 context:RequestContext,idInput:unknown,raw:unknown
){
 const id=z.string().uuid().parse(idInput);
 const input=hrNotificationReadSchema.parse(raw);
 if(!hasActiveRecruiter(context)||!context.recruiter||!ownsHrNotificationActor(context))
  throw new AuthorizationError("placements.recruiter.read");
 const allowed=await listOwnRecruiterPlacementJobs(context);
 const jobIds=allowed.filter(row=>row.companyId===context.recruiter!.companyId)
  .map(row=>row.job.id);
 if(jobIds.length===0)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 return getDb().transaction(async tx=>{
  const [current]=await tx.select({
   id:inAppNotifications.id,createdAt:inAppNotifications.createdAt,
   readAt:inAppNotifications.readAt,
  }).from(inAppNotifications)
   .innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
   .where(and(
    eq(inAppNotifications.id,id),eq(inAppNotifications.userId,context.user.id),
    eq(activityEvents.module,"PLACEMENTS"),eq(activityEvents.subjectType,"placement_job"),
    inArray(activityEvents.subjectId,jobIds),
    inArray(activityEvents.eventType,[...HR_NOTIFICATION_EVENTS]),
    inArray(activityEvents.collegeId,[...new Set(allowed.map(row=>row.collegeId))]),
   )).for("update").limit(1);
  if(!current)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  if(!hrNotificationVersionMatches(current.createdAt,input.expectedCreatedAt))
   throw new PlacementsServiceError("PLACEMENT_RECRUITER_NOTIFICATION_STALE");
  // A lost HTTP response must not turn a successful mark-read retry into an
  // apparent conflict. Scope and the original version have already been
  // rechecked inside this transaction; repeat acknowledgments do no writes.
  if(current.readAt)return {id:current.id,readAt:current.readAt.toISOString()};
  const [updated]=await tx.update(inAppNotifications).set({readAt:new Date()})
   .where(and(eq(inAppNotifications.id,id),eq(inAppNotifications.userId,context.user.id),
    isNull(inAppNotifications.readAt),
    sql`date_trunc('milliseconds', ${inAppNotifications.createdAt})=${input.expectedCreatedAt}::timestamptz`))
   .returning({id:inAppNotifications.id,readAt:inAppNotifications.readAt});
  if(!updated)throw new PlacementsServiceError("PLACEMENT_RECRUITER_NOTIFICATION_STALE");
  return {id:updated.id,readAt:updated.readAt?.toISOString()};
 });
}
