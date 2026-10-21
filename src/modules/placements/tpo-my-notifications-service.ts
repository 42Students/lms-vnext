import "server-only";
import { z } from "zod";

import {
  and,
  count,
  desc,
  eq,
  isNotNull,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";

import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {
  activityEvents,
  inAppNotifications,
  colleges,
} from "@/db/schema";
import {
  placementTpoUserPreferences,
} from "@/db/schema/tpo-collaboration";

import {
  hasMembershipRole,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
} from "@/modules/permissions/policy";

import {
  resolveTpoNotificationPreferences,
  safeTpoNotificationLabel,
  tpoMyNotificationsQuerySchema,
  tpoNotificationReadStatus,
} from "./tpo-my-notifications-model";
import { requirePlacementManageScope } from "./scope";
import { placementTableExists } from "./staged-tables";

/**
 * Read-only, own-recipient notification view.
 *
 * Crucially, listOwnNotifications() from the shared activity module
 * cannot be reused as-is: that service restricts the recipient
 * but does not restrict the source event to the current college.
 *
 * This read requires BOTH:
 *  - notification.user_id = authenticated user
 *  - activity_event.college_id = active TPO college
 *
 * Organization is checked as an additional boundary.
 * All three conditions are applied independently to every
 * count and paginated-record query.
 *
 * Arbitrary notification titles, bodies, action URLs,
 * activity summaries, event types and metadata are not
 * selected. The returned subject is a fixed module label.
 */
export async function getTpoMyNotifications(
  context: RequestContext,
  rawQuery: unknown = {},
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO") ||
    context.user.platformStatus !== "ACTIVE"
  ) {
    throw new AuthorizationError("placements.manage");
  }

  const query = tpoMyNotificationsQuerySchema.parse(rawQuery);
  const collegeId = context.membership.collegeId;
  const organizationId = context.membership.organizationId;
  const userId = context.user.id;

  await requirePlacementManageScope(context, collegeId);

  const db = getDb();

  const ownCollegeConditions: SQL[] = [
    eq(inAppNotifications.userId, userId),
    eq(activityEvents.collegeId, collegeId),
    eq(activityEvents.organizationId, organizationId),
  ];

  const filteredConditions = [...ownCollegeConditions];

  if (query.view === "UNREAD") {
    filteredConditions.push(
      isNull(inAppNotifications.readAt),
    );
  }

  if (query.view === "READ") {
    filteredConditions.push(
      isNotNull(inAppNotifications.readAt),
    );
  }

  const offset = (query.page - 1) * query.pageSize;

  const [
    allCounts,
    filteredCounts,
    records,
    preferenceTableAvailable,
  ] = await Promise.all([
    db
      .select({
        total: count(),
        unread: sql<number>`
          count(*) filter (
            where ${inAppNotifications.readAt} is null
          )::integer
        `,
      })
      .from(inAppNotifications)
      .innerJoin(
        activityEvents,
        eq(
          activityEvents.id,
          inAppNotifications.eventId,
        ),
      )
      .where(and(...ownCollegeConditions)),

    db
      .select({
        total: count(),
      })
      .from(inAppNotifications)
      .innerJoin(
        activityEvents,
        eq(
          activityEvents.id,
          inAppNotifications.eventId,
        ),
      )
      .where(and(...filteredConditions)),

    db
      .select({
        id: inAppNotifications.id,
        module: activityEvents.module,
        importance: activityEvents.importance,
        readAt: inAppNotifications.readAt,
        createdAt: inAppNotifications.createdAt,
      })
      .from(inAppNotifications)
      .innerJoin(
        activityEvents,
        eq(
          activityEvents.id,
          inAppNotifications.eventId,
        ),
      )
      .where(and(...filteredConditions))
      .orderBy(
        desc(inAppNotifications.createdAt),
        desc(inAppNotifications.id),
      )
      .limit(query.pageSize)
      .offset(offset),

    placementTableExists(
      "placement_tpo_user_preferences",
    ),
  ]);

  const total = Number(allCounts[0]?.total ?? 0);
  const unread = Number(allCounts[0]?.unread ?? 0);
  const matchedTotal = Number(
    filteredCounts[0]?.total ?? 0,
  );

  let persistedPreferences = null;
  let preferencesVersion:string|null=null;

  if (preferenceTableAvailable) {
    const [preference] = await db
      .select({
        updatedAt:placementTpoUserPreferences.updatedAt,
        morningDigest:
          placementTpoUserPreferences.morningDigest,
        recruiterMessages:
          placementTpoUserPreferences.recruiterMessages,
        requests:
          placementTpoUserPreferences.requests,
        resultsReady:
          placementTpoUserPreferences.resultsReady,
        followUps:
          placementTpoUserPreferences.followUps,
      })
      .from(placementTpoUserPreferences)
      .where(
        and(
          eq(placementTpoUserPreferences.collegeId, collegeId),
          eq(placementTpoUserPreferences.userId, userId),
        ),
      )
      .limit(1);

    if(preference)preferencesVersion=preference.updatedAt.toISOString();
    persistedPreferences = preference?{
      morningDigest:preference.morningDigest,recruiterMessages:preference.recruiterMessages,
      requests:preference.requests,resultsReady:preference.resultsReady,followUps:preference.followUps,
    }:null;
  }

  // The query may have started before a TPO role or account was revoked.
  // Recheck the active persisted TPO role at the response boundary; it is not
  // enough for a stale request context to have once held placements.manage.
  await db.transaction(async tx=>{
    const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
      .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
    if(!college||college.status!=="ACTIVE"||college.organizationId!==organizationId)
      throw new AuthorizationError("placements.manage");
    const persisted=await assertPersistedPlatformPermission(tx,context,"placements.manage",{
      collegeId,organizationId:college.organizationId,
    });
    if(!hasMembershipRole(persisted,"TPO"))
      throw new AuthorizationError("placements.manage");
  });

  return {
    query,
    collegeId,
    summary: {
      total,
      unread,
      read: total - unread,
    },
    page: query.page,
    pageSize: query.pageSize,
    matchedTotal,
    totalPages: Math.ceil(
      matchedTotal / query.pageSize,
    ),
    items: records.map((record) => ({
      id: record.id,
      subject: safeTpoNotificationLabel(record.module),
      module: record.module,
      importance: record.importance,
      status: tpoNotificationReadStatus(record.readAt),
      createdAt: record.createdAt,
      readAt: record.readAt,
    })),
    preferencesVersion,
    preferences: resolveTpoNotificationPreferences(
      preferenceTableAvailable,
      persistedPreferences,
    ),
  };
}

/**
 * Super Admin notification audit, intentionally separate from the TPO inbox.
 * The legacy fetchAll contract paginates from page zero, default 50, max 200.
 * A selected admin organization/college limits the query rather than expanding it.
 * This is a read-only recipient-level audit (one row per delivered/scheduled
 * notification), not a cross-tenant permission for other roles.
 */
const platformNotificationAuditQuerySchema = z.object({
  pageNo: z.coerce.number().int().min(0).max(100000).default(0),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
}).strict();

export async function getPlatformNotificationAudit(
  context: RequestContext,
  rawQuery: unknown = {},
) {
  const query = platformNotificationAuditQuerySchema.parse(rawQuery);
  if (!isSuperAdmin(context)) throw new AuthorizationError("activity.read");

  const organizationId = context.adminScope?.organizationId ?? null;
  const collegeId = context.adminScope?.collegeId ?? null;
  const db = getDb();

  // Never trust a cached SUPER_ADMIN role: recheck the actor and role in
  // persisted rows before querying notifications from other recipients.
  await db.transaction(async (tx) => {
    const persisted = await assertPersistedPlatformPermission(
      tx, context, "activity.read", {
        ...(organizationId ? { organizationId } : {}),
        ...(collegeId ? { collegeId } : {}),
      },
    );
    if (!isSuperAdmin(persisted)) throw new AuthorizationError("activity.read");
  });

  const conditions: SQL[] = [];
  if (organizationId) conditions.push(eq(activityEvents.organizationId, organizationId));
  if (collegeId) conditions.push(eq(activityEvents.collegeId, collegeId));
  const where = conditions.length ? and(...conditions) : undefined;

  const [totals, rows] = await Promise.all([
    db.select({ total: count() }).from(inAppNotifications)
      .innerJoin(activityEvents, eq(inAppNotifications.eventId, activityEvents.id))
      .where(where),
    db.select({
      id: inAppNotifications.id,
      recipientUserId: inAppNotifications.userId,
      eventId: inAppNotifications.eventId,
      title: inAppNotifications.title,
      body: inAppNotifications.body,
      createdAt: inAppNotifications.createdAt,
      readAt: inAppNotifications.readAt,
      deliveryStatus: inAppNotifications.deliveryStatus,
      deliveredAt: inAppNotifications.deliveredAt,
      collegeId: activityEvents.collegeId,
      organizationId: activityEvents.organizationId,
      module: activityEvents.module,
      eventType: activityEvents.eventType,
    }).from(inAppNotifications)
      .innerJoin(activityEvents, eq(inAppNotifications.eventId, activityEvents.id))
      .where(where)
      .orderBy(desc(inAppNotifications.createdAt), desc(inAppNotifications.id))
      .limit(query.pageSize)
      .offset(query.pageNo * query.pageSize),
  ]);

  const total = Number(totals[0]?.total ?? 0);
  return {
    pageNo: query.pageNo,
    pageSize: query.pageSize,
    total,
    totalPages: Math.ceil(total / query.pageSize),
    scope: { organizationId, collegeId },
    items: rows,
  };
}
