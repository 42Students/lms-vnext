import "server-only";

import { and, count, desc, asc, eq, gte, lte, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents,users } from "@/db/schema";
import { parseActivityDateBoundary } from "@/modules/activity/date-boundary";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {
  tpoActorAuditQuerySchema,
  type TpoActorAuditQuery,
  type TpoActorAuditRow,
} from "./tpo-actor-audit-model";

function conditions(collegeId: string, query: TpoActorAuditQuery): SQL[] {
  return [
    eq(activityEvents.collegeId, collegeId),
    eq(activityEvents.module, "PLACEMENTS"),
    ...(query.actorId ? [eq(activityEvents.actorUserId, query.actorId)] : []),
    ...(query.entityType ? [eq(activityEvents.subjectType, query.entityType)] : []),
    ...(query.entityId ? [eq(activityEvents.subjectId, query.entityId)] : []),
    ...(query.from
      ? [gte(activityEvents.occurredAt, parseActivityDateBoundary(query.from, "from"))]
      : []),
    ...(query.to
      ? [lte(activityEvents.occurredAt, parseActivityDateBoundary(query.to, "to"))]
      : []),
  ];
}

export async function getTpoActorAudit(
  context: RequestContext,
  raw: unknown,
  options: { exportLimit?: number } = {},
) {
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);
  const liveCollegeId=await requireTpoBatchActor(context);
  if(liveCollegeId!==collegeId)throw new AuthorizationError("placements.manage");
  const query = tpoActorAuditQuerySchema.parse(raw);
  const scope = and(...conditions(collegeId, query));
  const db = getDb();
  const [totalRow, items] = await Promise.all([
    db.select({ total: count() }).from(activityEvents).where(scope).then((rows) => rows[0]),
    db.select({
      id: activityEvents.id,
      occurredAt: activityEvents.occurredAt,
      actorId: activityEvents.actorUserId,
      actorName:users.displayName,
      eventType: activityEvents.eventType,
      entityType: activityEvents.subjectType,
      entityId: activityEvents.subjectId,
    })
      .from(activityEvents)
      .leftJoin(users,eq(users.id,activityEvents.actorUserId))
      .where(scope)
      .orderBy(query.sort==="OLDEST"?asc(activityEvents.occurredAt):desc(activityEvents.occurredAt),
       query.sort==="OLDEST"?asc(activityEvents.id):desc(activityEvents.id))
      .limit(options.exportLimit ?? query.pageSize)
      .offset(options.exportLimit ? 0 : (query.page - 1) * query.pageSize),
  ]);
  const total = totalRow?.total ?? 0;
  const rows: TpoActorAuditRow[] = items.map((item) => ({
    ...item,
    occurredAt: item.occurredAt.toISOString(),
  }));
  return {
    query,
    rows,
    total,
    page: query.page,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    truncated: options.exportLimit !== undefined && total > options.exportLimit,
  };
}
