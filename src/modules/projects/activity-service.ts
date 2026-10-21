import {
  and,
  desc,
  eq,
  gte,
  lt,
  ilike,
  or,
  sql,
} from "drizzle-orm";
import { learnerProjectActivityFilterSchema, learnerProjectActivityDateBounds, learnerProjectActivityPrefixes } from "./learner-project-activity-filter-model";
import { getDb } from "@/db/client";
import {
  activityEvents,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  requireProjectReadAccess,
} from "./access";

export async function getProjectActivityPage(
  context: RequestContext,
  projectIdInput: string,
  filterInput: unknown = {},
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );

  const filters = learnerProjectActivityFilterSchema.parse(filterInput);
  const bounds = learnerProjectActivityDateBounds(filters);
  const prefixes = learnerProjectActivityPrefixes(filters.category);

  const rows = await getDb()
    .select({
      id: activityEvents.id,
      eventType:
        activityEvents.eventType,
      importance:
        activityEvents.importance,
      subjectType:
        activityEvents.subjectType,
      subjectId:
        activityEvents.subjectId,
      subjectLabel:
        activityEvents.subjectLabel,
      summary:
        activityEvents.summary,
      occurredAt:
        activityEvents.occurredAt,
      // Preserve PostgreSQL microseconds; JS Date only serializes milliseconds.
      cursorOccurredAt: sql<string>`to_char(${activityEvents.occurredAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`.as("cursor_occurred_at"),
      // Prefer immutable import-time actor display metadata if present.
      actorDisplayName: sql<string|null>`coalesce(
        nullif(${activityEvents.actorNameSnapshot},''),
        nullif(${activityEvents.metadata} ->> 'actorName',''),
        ${users.displayName}
      )`,
      actorType: sql<string|null>`coalesce(
        nullif(${activityEvents.actorRoleSnapshot},''),
        nullif(${activityEvents.metadata} ->> 'actorType','')
      )`,
      sourceTab: sql<string|null>`nullif(${activityEvents.metadata} ->> 'sourceTab','')`,
    })
    .from(activityEvents)
    .leftJoin(
      users,
      eq(
        users.id,
        activityEvents.actorUserId,
      ),
    )
    .where(
      and(
        filters.beforeTime && filters.beforeId ? or(
          sql`${activityEvents.occurredAt} < ${filters.beforeTime}::timestamptz`,
          and(sql`${activityEvents.occurredAt} = ${filters.beforeTime}::timestamptz`,
            lt(activityEvents.id, filters.beforeId)),
        ) : undefined,
        bounds.from ? gte(activityEvents.occurredAt, bounds.from) : undefined,
        bounds.until ? lt(activityEvents.occurredAt, bounds.until) : undefined,
        prefixes.length ? or(...prefixes.map(prefix => ilike(activityEvents.eventType, prefix + "%"))) : undefined,
        filters.eventType?eq(activityEvents.eventType,filters.eventType):undefined,
        eq(
          activityEvents.module,
          "PROJECTS",
        ),
        eq(
          activityEvents.collegeId,
          scope.collegeId,
        ),
        or(
          and(
            or(eq(activityEvents.subjectType,"project"),
               eq(activityEvents.subjectType,"project_instance")),
            eq(activityEvents.subjectId,scope.project.id),
          ),
          sql`${activityEvents.metadata} ->> 'projectId' = ${scope.project.id}`,
          scope.project.legacyProjectId!==null?
           eq(activityEvents.legacyProjectId,scope.project.legacyProjectId):undefined,
        ),
      ),
    )
    .orderBy(
      desc(
        activityEvents.occurredAt,
      ),
      desc(activityEvents.id),
    )
    .limit(filters.size+1)
    .offset(filters.beforeTime?0:(filters.page-1)*filters.size);

  return {message:"Project activity feed retrieved",
    page:filters.page,pageSize:filters.size,
    events:rows.slice(0,filters.size),hasMore:rows.length>filters.size};
}

/** Preserve the original bounded array contract for existing shared workspaces. */
export async function listProjectActivity(
  context: RequestContext, projectIdInput: string, filterInput: unknown = {},
) {
  const page = await getProjectActivityPage(context, projectIdInput, filterInput);
  return page.events.map(event => ({
    id: event.id, eventType: event.eventType, importance: event.importance,
    subjectType: event.subjectType, subjectId: event.subjectId,
    subjectLabel: event.subjectLabel, summary: event.summary,
    occurredAt: event.occurredAt, actorDisplayName: event.actorDisplayName,
    actorType:event.actorType,sourceTab:event.sourceTab,
  }));
}
