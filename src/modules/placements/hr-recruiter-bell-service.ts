import "server-only";
import {and,eq,inArray,isNull,lte,sql} from "drizzle-orm";
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

/** A scoped aggregate for the 30-second badge poll. No private feed is sent.
 * There is no legacy MySQL data migration in vNext; a recruiter's first
 * persisted read receipt replaces the old read-through watermark. Until then
 * only the last seven days are initially counted as new.
 */
export async function countHrRecruiterBellUnread(ctx:RequestContext){
 if(!hasActiveRecruiter(ctx)||!ctx.recruiter||ctx.recruiter.userId!==ctx.user.id)
  throw new AuthorizationError("placements.recruiter.read");
 const grants=[...new Set(ctx.recruiter.grants.map(grant=>grant.collegeId))];
 if(grants.length!==1)return {status:grants.length?"CHOOSE_COLLEGE" as const:"NO_ACCESS" as const,
  unread:0,firstVisit:true};
 const jobs=(await listOwnRecruiterPlacementJobs(ctx,grants[0]))
  .filter(row=>row.collegeId===grants[0]&&row.companyId===ctx.recruiter!.companyId);
 const ids=[...new Set(jobs.map(row=>row.job.id))];
 if(ids.length===0)return {status:"READY" as const,unread:0,firstVisit:true};
 const scope=and(eq(inAppNotifications.userId,ctx.user.id),
  eq(activityEvents.module,"PLACEMENTS"),eq(activityEvents.subjectType,"placement_job"),
  eq(activityEvents.collegeId,grants[0]),inArray(activityEvents.subjectId,ids),
  inArray(activityEvents.eventType,[...HR_NOTIFICATION_EVENTS]),
  sql`${inAppNotifications.createdAt} >= now() - interval '30 days'`);
 const [stats]=await getDb().select({
  totalUnread:sql<number>`count(*) filter (where ${inAppNotifications.readAt} is null)::integer`,
  recentUnread:sql<number>`count(*) filter (where ${inAppNotifications.readAt} is null and ${inAppNotifications.createdAt} >= now() - interval '7 days')::integer`,
  readReceipts:sql<number>`count(*) filter (where ${inAppNotifications.readAt} is not null)::integer`,
 }).from(inAppNotifications).innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
  .where(scope);
 const firstVisit=Number(stats?.readReceipts??0)===0;
 return {status:"READY" as const,firstVisit,
  unread:Number(firstVisit?stats?.recentUnread??0:stats?.totalUnread??0)};
}
function hrBellTab(label:string):"overview"|"applicants"|"rounds"|"offers"|"requests"|"discussion"{
 if(label==="Drive closed"||label.includes("offer")||label.includes("Offer"))return "offers";
 if(label.includes("applicant")||label.includes("Applicant"))return "applicants";
 if(label.includes("round")||label.includes("Round")||label.includes("slot"))return "rounds";
 if(label.includes("request")||label.includes("Request"))return "requests";
 if(label.includes("message")||label.includes("Message"))return "discussion";
 return "overview";
}
export async function readHrRecruiterBell(ctx:RequestContext){
 const [data,count]=await Promise.all([listHrNotifications(ctx,{}),countHrRecruiterBellUnread(ctx)]);
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
 const sevenDaysAgo=Date.now()-7*86400000;
 const items=rows.map(item=>({
   id:item.id,label:item.label,title:item.title,
   unread:item.unread&&(!count.firstVisit||item.createdAt.getTime()>=sevenDaysAgo),
   at:item.createdAt.toISOString(),
   href:"/hr/placements/jobs/"+encodeURIComponent(item.jobId)+"?tab="+hrBellTab(item.label),
 }));
 const hiddenUnread=Math.max(0,count.unread-items.filter(item=>item.unread).length);
 return {status:"READY" as const,unread:count.unread,unreadTotal:count.unread,
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
 const updated=await getDb().update(inAppNotifications).set({readAt:sql`CURRENT_TIMESTAMP`})
  .where(and(eq(inAppNotifications.userId,ctx.user.id),isNull(inAppNotifications.readAt),
   inArray(inAppNotifications.eventId,nested),
   lte(inAppNotifications.createdAt,sql`CURRENT_TIMESTAMP`)))
  .returning({id:inAppNotifications.id});
 return {marked:updated.length};
}
