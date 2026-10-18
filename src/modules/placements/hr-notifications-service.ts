import "server-only";
import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {inAppNotifications,activityEvents} from "@/db/schema";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listOwnRecruiterPlacementJobs} from "./recruiter-service";
import {hrNotificationsQuerySchema,HR_NOTIFICATION_EVENTS,HR_INBOX_PAGE_SIZE,hrInboxPageBounds,filterHrNotificationJobs,projectHrNotifications} from "./hr-notifications-model";
export async function listHrNotifications(context:RequestContext,raw:unknown={}) {
 const query=hrNotificationsQuerySchema.parse(raw);
 if(!hasActiveRecruiter(context)||!context.recruiter||context.recruiter.userId!==context.user.id)
  throw new AuthorizationError("placements.recruiter.read");
 const grants=context.recruiter.grants;
 if(query.collegeId&&!grants.some(g=>g.collegeId===query.collegeId))
  throw new AuthorizationError("placements.recruiter.read");
 const colleges=[...new Set(grants.map(g=>g.collegeId))];
 const collegeId=query.collegeId??(colleges.length===1?colleges[0]:null);
 if(!collegeId)return {status:grants.length?"CHOOSE_COLLEGE" as const:"NO_ACCESS" as const,
  choices:grants,rows:[],unread:0,truncated:false,page:query.page,pages:0,total:0,first:0,last:0};
 const allJobs=await listOwnRecruiterPlacementJobs(context);
 const jobs=filterHrNotificationJobs(allJobs.filter(row=>row.collegeId===collegeId&&row.companyId===context.recruiter!.companyId)
  .map(row=>({id:row.job.id,title:row.job.title})),query.q);
 const jobIds=jobs.map(j=>j.id);
 const db=getDb();
 const scope=and(eq(inAppNotifications.userId,context.user.id),eq(activityEvents.collegeId,collegeId),
  eq(activityEvents.subjectType,"placement_job"),eq(activityEvents.module,"PLACEMENTS"),
  ...(jobIds.length?[inArray(activityEvents.subjectId,jobIds)]:[]),
  inArray(activityEvents.eventType,[...HR_NOTIFICATION_EVENTS]));
 const [stats]=jobIds.length?await db.select({
  total:sql<number>`count(*)::integer`,
  unread:sql<number>`count(*) filter (where ${inAppNotifications.readAt} is null)::integer`,
 }).from(inAppNotifications).innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
 .where(scope):[{total:0,unread:0}];
 const total=Number(stats?.total??0),unread=Number(stats?.unread??0);
 const selectedTotal=query.unreadOnly==="true"?unread:total;
 const bounds=hrInboxPageBounds(query.page,selectedTotal);
 const rows=jobIds.length?await db.select({
  id:inAppNotifications.id,createdAt:inAppNotifications.createdAt,
  readAt:inAppNotifications.readAt,subjectId:activityEvents.subjectId,
  eventType:activityEvents.eventType,
 }).from(inAppNotifications).innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
 .where(query.unreadOnly==="true"?and(scope,isNull(inAppNotifications.readAt)):scope)
 .orderBy(desc(inAppNotifications.createdAt),desc(inAppNotifications.id))
 .limit(HR_INBOX_PAGE_SIZE).offset((query.page-1)*HR_INBOX_PAGE_SIZE):[];
 return {status:"READY" as const,choices:grants,collegeId,
  rows:projectHrNotifications(rows,jobs),
  unread,total,truncated:bounds.pages>query.page,
  page:query.page,pages:bounds.pages,first:bounds.first,last:bounds.last};
}
