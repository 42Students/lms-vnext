import "server-only";
import {and,eq,inArray,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications} from "@/db/schema";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listOwnRecruiterPlacementJobs} from "./recruiter-service";
import {listHrNotifications} from "./hr-notifications-service";
import {HR_NOTIFICATION_EVENTS} from "./hr-notifications-model";
/** Scope is resolved by the inbox service before either feed page is read.
 * Only the newest 40 events from the last 30 days are shown in the bell.
 * Older unread receipts are reported as hidden, not silently marked read. */
export async function readHrRecruiterBell(ctx:RequestContext){
 const data=await listHrNotifications(ctx,{});
 if(data.status!=="READY")return {
  status:data.status,unread:0,unreadTotal:0,hiddenUnread:0,feed:[],items:[],
 };
 const more=data.pages>1
  ? await listHrNotifications(ctx,{collegeId:data.collegeId,page:2})
  : null;
 const cutoff=Date.now()-30*24*60*60*1000;
 const rows=[...data.rows,...(more?.status==="READY"?more.rows:[])]
  .filter(item=>item.createdAt.getTime()>=cutoff)
  .slice(0,40);
 const items=rows.map(item=>({
   id:item.id,label:item.label,unread:item.unread,
   at:item.createdAt.toISOString(),
   href:"/hr/placements/jobs/"+encodeURIComponent(item.jobId),
 }));
 const hiddenUnread=Math.max(0,data.unread-items.filter(item=>item.unread).length);
 return {status:"READY" as const,unread:data.unread,unreadTotal:data.unread,
  hiddenUnread,feed:items,items};
}
/** Mark only the caller's notifications for persisted employer-visible drives.
 * Other users, ungranted colleges and message threads cannot be modified. */
export async function markHrRecruiterBellRead(ctx:RequestContext){
 if(!hasActiveRecruiter(ctx)||!ctx.recruiter)
  throw new AuthorizationError("placements.recruiter.read");
 const feed=await listHrNotifications(ctx,{});
 if(feed.status!=="READY")return {marked:0};
 const visible=(await listOwnRecruiterPlacementJobs(ctx,feed.collegeId))
  .filter(x=>x.companyId===ctx.recruiter!.companyId && x.collegeId===feed.collegeId);
 const ids=[...new Set(visible.map(x=>x.job.id))];
 const colleges=[...new Set(visible.map(x=>x.collegeId))];
 if(!ids.length||!colleges.length)return {marked:0};
 const nested=getDb().select({id:activityEvents.id}).from(activityEvents)
  .where(and(eq(activityEvents.module,"PLACEMENTS"),eq(activityEvents.subjectType,"placement_job"),
   inArray(activityEvents.subjectId,ids),
   inArray(activityEvents.collegeId,colleges),
   inArray(activityEvents.eventType,[...HR_NOTIFICATION_EVENTS])));
 const updated=await getDb().update(inAppNotifications).set({readAt:new Date()})
  .where(and(eq(inAppNotifications.userId,ctx.user.id),isNull(inAppNotifications.readAt),
   inArray(inAppNotifications.eventId,nested)))
  .returning({id:inAppNotifications.id});
 return {marked:updated.length};
}
