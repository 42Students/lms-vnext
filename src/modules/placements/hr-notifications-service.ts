import "server-only";
import {and,desc,eq,inArray,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {inAppNotifications,activityEvents} from "@/db/schema";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listOwnRecruiterPlacementJobs} from "./recruiter-service";
import {hrNotificationsQuerySchema,HR_NOTIFICATION_EVENTS,projectHrNotifications} from "./hr-notifications-model";
export async function listHrNotifications(context:RequestContext,raw:unknown={}) {
 const query=hrNotificationsQuerySchema.parse(raw);
 if(!hasActiveRecruiter(context)||!context.recruiter)
  throw new AuthorizationError("placements.recruiter.read");
 const grants=context.recruiter.grants;
 if(query.collegeId&&!grants.some(g=>g.collegeId===query.collegeId))
  throw new AuthorizationError("placements.recruiter.read");
 const colleges=[...new Set(grants.map(g=>g.collegeId))];
 const collegeId=query.collegeId??(colleges.length===1?colleges[0]:null);
 if(!collegeId)return {status:grants.length?"CHOOSE_COLLEGE" as const:"NO_ACCESS" as const,
  choices:grants,rows:[],unread:0,truncated:false};
 const allJobs=await listOwnRecruiterPlacementJobs(context);
 const jobs=allJobs.filter(row=>row.collegeId===collegeId&&row.companyId===context.recruiter!.companyId)
  .map(row=>({id:row.job.id,title:row.job.title}));
 const jobIds=jobs.map(j=>j.id);
 const rows=jobIds.length?await getDb().select({
  id:inAppNotifications.id,createdAt:inAppNotifications.createdAt,
  readAt:inAppNotifications.readAt,subjectId:activityEvents.subjectId,
  eventType:activityEvents.eventType,
 }).from(inAppNotifications).innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
 .where(and(eq(inAppNotifications.userId,context.user.id),eq(activityEvents.collegeId,collegeId),
  eq(activityEvents.subjectType,"placement_job"),eq(activityEvents.module,"PLACEMENTS"),
  inArray(activityEvents.subjectId,jobIds),
  inArray(activityEvents.eventType,[...HR_NOTIFICATION_EVENTS]),
  ...(query.unreadOnly==="true"?[isNull(inAppNotifications.readAt)]:[])))
 .orderBy(desc(inAppNotifications.createdAt),desc(inAppNotifications.id)).limit(101):[];
 const visible=projectHrNotifications(rows.slice(0,100),jobs);
 return {status:"READY" as const,choices:grants,collegeId,rows:visible,
  unread:visible.filter(item=>item.unread).length,truncated:rows.length>100};
}
