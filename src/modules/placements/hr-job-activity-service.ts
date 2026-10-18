import "server-only";
import {and,desc,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listOwnRecruiterPlacementJobs} from "./recruiter-service";
import {hrActivityQuerySchema,hrActivityEventFilter,hrActivityHasNext,projectHrJobActivity,searchHrActivityJobs,clampHrActivityPage} from "./hr-job-activity-model";
export async function listRecruiterJobActivity(context:RequestContext,raw:unknown={}) {
 const query=hrActivityQuerySchema.parse(raw);
 if(!hasActiveRecruiter(context)||!context.recruiter||context.recruiter.userId!==context.user.id)
  throw new AuthorizationError("placements.recruiter.read");
 const grants=context.recruiter.grants;
 if(query.collegeId&&!grants.some(g=>g.collegeId===query.collegeId))
  throw new AuthorizationError("placements.recruiter.read");
 const colleges=[...new Set(grants.map(g=>g.collegeId))];
 const collegeId=query.collegeId??(colleges.length===1?colleges[0]:null);
 if(!collegeId)return {status:grants.length?"CHOOSE_COLLEGE" as const:"NO_ACCESS" as const,
   choices:grants,events:[]};
 const owned=await listOwnRecruiterPlacementJobs(context);
 const jobs=searchHrActivityJobs(owned.filter(row=>row.collegeId===collegeId&&row.companyId===context.recruiter!.companyId)
  .map(row=>({id:row.job.id,title:row.job.title})),query.q);
 const ids=jobs.map(job=>job.id);
 const where=and(
  eq(activityEvents.collegeId,collegeId),eq(activityEvents.module,"PLACEMENTS"),
  eq(activityEvents.subjectType,"placement_job"),inArray(activityEvents.subjectId,ids),
  inArray(activityEvents.eventType,[...hrActivityEventFilter(query.kind)]),
 );
 const [count]=ids.length?await getDb().select({total:sql<number>`count(*)::integer`})
  .from(activityEvents).where(where):[{total:0}];
 const effectivePage=clampHrActivityPage(query.page,Number(count?.total??0),query.limit);
 const rows=ids.length?await getDb().select({
  id:activityEvents.id,subjectId:activityEvents.subjectId,
  eventType:activityEvents.eventType,occurredAt:activityEvents.occurredAt,
 }).from(activityEvents).where(where)
  .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id))
  .limit(query.limit+1).offset((effectivePage-1)*query.limit):[];
 return {status:"READY" as const,choices:grants,collegeId,
   events:projectHrJobActivity(rows.slice(0,query.limit),jobs),page:effectivePage,
   hasNext:hrActivityHasNext(rows.length,query.limit)};
}
