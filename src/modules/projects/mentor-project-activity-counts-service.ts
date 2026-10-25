import "server-only";
import {and,eq,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {summarizeMentorProjectActivityCounts} from "./mentor-project-activity-counts-model";

/** Count before paging, with the same persisted tenant/project predicate used
 * by getProjectActivityPage. Imported Sprint events can lack projectId metadata,
 * so their subject must resolve to a Sprint owned by this authorized project.
 */
export async function getMentorProjectActivityCounts(
  context:RequestContext,projectId:string,now:Date=new Date(),
){
  const scope=await requireProjectReadAccess(context,projectId);
  if(scope.access!=="MENTOR"||!Number.isFinite(now.getTime()))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const from=new Date(now.getTime()-7*86_400_000);
  const rows=await getDb().select({
    eventType:activityEvents.eventType,
    total:sql<number>`count(*)::int`,
    lastSevenDays:sql<number>`count(*) filter (where
      ${activityEvents.occurredAt} >= ${from.toISOString()}::timestamptz and
      ${activityEvents.occurredAt} <= ${now.toISOString()}::timestamptz)::int`,
  }).from(activityEvents).where(and(
    eq(activityEvents.module,"PROJECTS"),
    eq(activityEvents.collegeId,scope.collegeId),
    eq(activityEvents.organizationId,scope.organizationId),
    or(
      and(
        or(eq(activityEvents.subjectType,"project"),
           eq(activityEvents.subjectType,"project_instance")),
        eq(activityEvents.subjectId,scope.project.id),
      ),
      sql`${activityEvents.metadata} ->> 'projectId' = ${scope.project.id}`,
      and(
        eq(activityEvents.subjectType,"project_sprint"),
        sql`exists (select 1 from project_sprints ps
          where ps.id::text = ${activityEvents.subjectId}
            and ps.project_id = ${scope.project.id})`,
      ),
      scope.project.legacyProjectId!==null?
        eq(activityEvents.legacyProjectId,scope.project.legacyProjectId):undefined,
    ),
  )).groupBy(activityEvents.eventType);
  return summarizeMentorProjectActivityCounts(rows.map(row=>({
    eventType:row.eventType,total:Number(row.total),
    lastSevenDays:Number(row.lastSevenDays),
  })));
}
