import "server-only";
import {and,eq,gte,inArray,isNull,lte,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications,placementJobs} from "@/db/schema";
import {placementRecruiterNotificationReads,placementTpoMessages,placementTpoMessageThreads} from "@/db/schema/tpo-collaboration";
import {getRecruiterNotificationReadThreshold} from "./hr-recruiter-read-watermark-service";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listOwnRecruiterPlacementJobs} from "./recruiter-service";
import {listHrNotifications} from "./hr-notifications-service";
import {HR_NOTIFICATION_EVENTS} from "./hr-notifications-model";
import {listRecentUnreadRecruiterThreads} from "./hr-conversation-inbox-service";
import {loadActiveRecruiterGrant} from "./tpo-messaging-service";
import {hrConversationsHref} from "./hr-conversation-urls-model";
/** Scope is resolved by the inbox service before either feed page is read.
 * Only the newest 40 events from the last 30 days are shown in the bell.
 * Older unread receipts are reported as hidden, not silently marked read. */

/** A scoped aggregate for the 30-second badge poll. No private feed is sent.
 * There is no legacy MySQL data migration in vNext; a recruiter's first
 * read-through watermark is now the durable first-visit boundary. Until its
 * first explicit acknowledgement, only the last seven days count as new.
 */
export async function countHrRecruiterBellUnread(ctx:RequestContext){
 if(!hasActiveRecruiter(ctx)||!ctx.recruiter||ctx.recruiter.userId!==ctx.user.id)
  throw new AuthorizationError("placements.recruiter.read");
 const grants=[...new Set(ctx.recruiter.grants.map(grant=>grant.collegeId))];
 if(grants.length!==1)return {status:grants.length?"CHOOSE_COLLEGE" as const:"NO_ACCESS" as const,
  unread:0,firstVisit:true};
 const collegeId=grants[0];
 if(!collegeId)return {status:"NO_ACCESS" as const,unread:0,firstVisit:true};
 const threshold=await getRecruiterNotificationReadThreshold(ctx.user.id,collegeId);
 // TPO private message threads have their own persisted read_at receipts;
 // event notifications instead use the per-college read-through watermark.
 const unreadThreads=(await listRecentUnreadRecruiterThreads(ctx,collegeId)).length;
 const jobs=(await listOwnRecruiterPlacementJobs(ctx,collegeId))
  .filter(row=>row.collegeId===collegeId&&row.companyId===ctx.recruiter!.companyId);
 const ids=[...new Set(jobs.map(row=>row.job.id))];
 if(ids.length===0)return {status:"READY" as const,unread:unreadThreads,
  firstVisit:threshold.firstVisit};
 const scope=and(eq(inAppNotifications.userId,ctx.user.id),
  eq(activityEvents.module,"PLACEMENTS"),eq(activityEvents.subjectType,"placement_job"),
  eq(activityEvents.collegeId,collegeId),inArray(activityEvents.subjectId,ids),
  inArray(activityEvents.eventType,[...HR_NOTIFICATION_EVENTS]),
  sql`${inAppNotifications.createdAt} >= now() - interval '30 days'`);
 const [stats]=await getDb().select({
  unread:sql<number>`count(*) filter (where ${inAppNotifications.readAt} is null and ${inAppNotifications.createdAt} > ${threshold.unreadSince})::integer`,
 }).from(inAppNotifications).innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
  .where(scope);
 return {status:"READY" as const,firstVisit:threshold.firstVisit,
  unread:Number(stats?.unread??0)+unreadThreads};
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
  .filter(item=>item.createdAt.getTime()>=cutoff);
 const eventItems=rows.map(item=>({
   id:item.id,label:item.label,title:item.title,
   unread:item.unread,
   at:item.createdAt.toISOString(),
   href:"/hr/placements/jobs/"+encodeURIComponent(item.jobId)+"?tab="+hrBellTab(item.label),
 }));
 // Unread TPO message threads (last message within 30 days), same college scope.
 const threads=await listRecentUnreadRecruiterThreads(ctx,data.collegeId);
 const threadJobs=threads.some(thread=>thread.jobId)
  ?await listOwnRecruiterPlacementJobs(ctx,data.collegeId,{
    jobIds:[...new Set(threads.flatMap(thread=>thread.jobId?[thread.jobId]:[]))],
  }):[];
 const jobTitles=new Map(threadJobs.map(row=>[row.job.id,row.job.title]));
 const messageItems=threads.map(thread=>({
   id:"m-"+thread.id,label:"New message",
   title:"New message: "+(thread.jobId?(jobTitles.get(thread.jobId)??"Authorized drive"):"General conversation"),
   unread:true,at:thread.lastMessageAt.toISOString(),
   href:thread.jobId
    ?"/hr/placements/jobs/"+encodeURIComponent(thread.jobId)+"?tab=discussion"
    :hrConversationsHref({collegeId:data.collegeId,q:"",unreadOnly:"true",page:1}),
 }));
 const items=[...eventItems,...messageItems]
  .sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,40);
 const hiddenUnread=Math.max(0,count.unread-items.filter(item=>item.unread).length);
 return {status:"READY" as const,unread:count.unread,unreadTotal:count.unread,
  hiddenUnread,feed:items,items};
}
/** A single click acknowledges both event receipts and the TPO messages that
 * contribute to the recruiter bell badge. It never modifies another
 * recruiter/college/company or an ungranted drive. The persisted active grant
 * and job/thread parents are rechecked under transaction locks, rather than
 * trusting a stale session or the earlier badge projection. */
export async function markHrRecruiterBellRead(ctx:RequestContext){
 if(!hasActiveRecruiter(ctx)||!ctx.recruiter||ctx.recruiter.userId!==ctx.user.id)
  throw new AuthorizationError("placements.recruiter.read");
 const feed=await listHrNotifications(ctx,{});
 if(feed.status!=="READY")return {marked:0};
 const visible=(await listOwnRecruiterPlacementJobs(ctx,feed.collegeId))
  .filter(x=>x.companyId===ctx.recruiter!.companyId && x.collegeId===feed.collegeId);
 const candidateJobIds=[...new Set(visible.map(row=>row.job.id))];
 // General conversations have no job and must still be acknowledged when the
 // recruiter has no drives. Only threads in the 30-day bell are considered.
 const recentThreads=await listRecentUnreadRecruiterThreads(ctx,feed.collegeId);
 const candidateThreadIds=recentThreads.map(thread=>thread.id);
 const cutoff=new Date(Date.now()-30*86400000);
 return getDb().transaction(async tx=>{
  const grant=await loadActiveRecruiterGrant(tx,ctx.user.id,feed.collegeId,true);
  if(!grant)throw new AuthorizationError("placements.recruiter.read");
  // A job belonging to the same employer but a different relationship/college
  // must never be acknowledged with an outdated in-memory recruiter grant.
  const jobs=candidateJobIds.length?await tx.select({id:placementJobs.id})
   .from(placementJobs).where(and(
    inArray(placementJobs.id,candidateJobIds),
    eq(placementJobs.collegeId,feed.collegeId),
    eq(placementJobs.companyRelationshipId,grant.companyRelationshipId),
   )).orderBy(placementJobs.id).for("share"):[];
  const jobIds=jobs.map(job=>job.id);
  const allowedJobs=new Set(jobIds);
  const threads=candidateThreadIds.length?await tx.select({
   id:placementTpoMessageThreads.id,
   jobId:placementTpoMessageThreads.jobId,
  }).from(placementTpoMessageThreads).where(and(
   inArray(placementTpoMessageThreads.id,candidateThreadIds),
   eq(placementTpoMessageThreads.collegeId,feed.collegeId),
   eq(placementTpoMessageThreads.recruiterUserId,ctx.user.id),
   gte(placementTpoMessageThreads.lastMessageAt,cutoff),
  )).orderBy(placementTpoMessageThreads.id).for("share"):[];
  const threadIds=threads.filter(thread=>!thread.jobId||allowedJobs.has(thread.jobId))
   .map(thread=>thread.id);
  const now=new Date();
  const eventIds=jobIds.length?tx.select({id:activityEvents.id})
   .from(activityEvents).where(and(
    eq(activityEvents.module,"PLACEMENTS"),
    eq(activityEvents.subjectType,"placement_job"),
    eq(activityEvents.collegeId,feed.collegeId),
    inArray(activityEvents.subjectId,jobIds),
    inArray(activityEvents.eventType,[...HR_NOTIFICATION_EVENTS]),
   )):null;
  const notifications=eventIds?await tx.update(inAppNotifications).set({readAt:now})
   .where(and(
    eq(inAppNotifications.userId,ctx.user.id),
    isNull(inAppNotifications.readAt),
    inArray(inAppNotifications.eventId,eventIds),
    lte(inAppNotifications.createdAt,now),
   )).returning({id:inAppNotifications.id}):[];
  const messages=threadIds.length?await tx.update(placementTpoMessages).set({readAt:now})
   .where(and(
    inArray(placementTpoMessages.threadId,threadIds),
    eq(placementTpoMessages.senderType,"TPO"),
    eq(placementTpoMessages.kind,"MESSAGE"),
    isNull(placementTpoMessages.readAt),
    lte(placementTpoMessages.createdAt,now),
   )).returning({id:placementTpoMessages.id}):[];
  // A real, monotonic marker is required even when the recruiter has no
  // drive/event receipts. Use database statement time to satisfy the DB09
  // future-value guard; GREATEST makes concurrent clicks non-regressing.
  await tx.insert(placementRecruiterNotificationReads).values({
   recruiterUserId:ctx.user.id,collegeId:feed.collegeId,
   readThrough:sql`statement_timestamp()`,
  }).onConflictDoUpdate({
   target:[placementRecruiterNotificationReads.recruiterUserId,
    placementRecruiterNotificationReads.collegeId],
   set:{readThrough:sql`greatest(${placementRecruiterNotificationReads.readThrough}, statement_timestamp())`},
  });
  return {marked:notifications.length+messages.length,
   notificationsMarked:notifications.length,messagesMarked:messages.length};
 });
}
