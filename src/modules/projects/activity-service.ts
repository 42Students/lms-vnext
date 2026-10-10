import {
  and,
  desc,
  eq,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  requireProjectReadAccess,
} from "./access";

export async function listProjectActivity(
  context: RequestContext,
  projectIdInput: string,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );

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
      actorDisplayName:
        users.displayName,
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
            eq(
              activityEvents.subjectType,
              "project",
            ),
            eq(
              activityEvents.subjectId,
              scope.project.id,
            ),
          ),
          sql`${activityEvents.metadata} ->> 'projectId' = ${scope.project.id}`,
        ),
      ),
    )
    .orderBy(
      desc(
        activityEvents.occurredAt,
      ),
      desc(activityEvents.id),
    )
    .limit(100);

  return rows;
}
