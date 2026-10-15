import "server-only";

import { and, asc, count, desc, eq, gte, lt, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents } from "@/db/schema";
import { hasActiveMembership, hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { requireProjectReadAccess } from "./access";
import { ProjectsServiceError } from "./errors";
import { safeMentorProjectEventLabel } from "./mentor-portfolio-model";
import { mentorProjectActivityEventTypes, mentorProjectActivityPage, mentorProjectActivityQuerySchema, mentorProjectActivitySince } from "./mentor-project-activity-model";

/** Exact project history read; raw actor names, summaries and metadata stay private. */
export async function getMentorProjectActivityHistory(
  context: RequestContext, rawQuery: unknown,
) {
  const query=mentorProjectActivityQuerySchema.parse(rawQuery);
  const membership=context.membership;
  if(!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context,"MENTOR") ||
      !can(context,"projects.read",{
        collegeId:membership.collegeId,organizationId:membership.organizationId,
      })) throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const scope=await requireProjectReadAccess(context,query.projectId);
  if(scope.access!=="MENTOR" || scope.collegeId!==membership.collegeId ||
    !can(context,"projects.read",{
      collegeId:scope.collegeId,organizationId:scope.organizationId,
    })) throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const enabled=(await resolveOptionalModuleAccess(context)).projects.enabled;
  const empty=()=>({
    enabled:false as const,title:scope.project.title,query,
    ...mentorProjectActivityPage(0,1,query.pageSize),
    items:[] as {id:string;label:string;importance:string;occurredAt:Date}[],
  });
  if(!enabled)return empty();
  const allowedTypes=mentorProjectActivityEventTypes(query.view);
  const since=mentorProjectActivitySince(query.window,new Date());
  const filters=and(
    eq(activityEvents.module,"PROJECTS"),
    allowedTypes?inArray(activityEvents.eventType,allowedTypes):undefined,
    eq(activityEvents.collegeId,scope.collegeId),
    eq(activityEvents.organizationId,scope.organizationId),
    since?(query.window==="OLDER_THAN_30_DAYS"
      ?lt(activityEvents.occurredAt,since):gte(activityEvents.occurredAt,since)):undefined,
    or(
      and(eq(activityEvents.subjectType,"project"),
        eq(activityEvents.subjectId,scope.project.id)),
      sql`${activityEvents.metadata} ->> 'projectId' = ${scope.project.id}`,
    ),
    query.importance==="ALL"?undefined:
      eq(activityEvents.importance,query.importance),
  );
  const db=getDb();
  const [summary]=await db.select({total:count()}).from(activityEvents).where(filters);
  const paging=mentorProjectActivityPage(Number(summary?.total??0),query.page,query.pageSize);
  const rows=await db.select({
    id:activityEvents.id,
    eventType:activityEvents.eventType,
    importance:activityEvents.importance,
    occurredAt:activityEvents.occurredAt,
  }).from(activityEvents).where(filters)
    .orderBy(query.order==="OLDEST"?asc(activityEvents.occurredAt):desc(activityEvents.occurredAt),
      query.order==="OLDEST"?asc(activityEvents.id):desc(activityEvents.id))
    .limit(paging.pageSize).offset((paging.page-1)*paging.pageSize);
  return {
    enabled:true as const,title:scope.project.title,query,...paging,
    items:rows.map(row=>({
      id:row.id,label:safeMentorProjectEventLabel(row.eventType),
      importance:row.importance,occurredAt:row.occurredAt,
    })),
  };
}
