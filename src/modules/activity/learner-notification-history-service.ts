import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  membershipRoles,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { requireLearnerNotificationsAccess } from "./learner-notifications-access";
import { listOwnNotificationPage } from "./notification-service";
import { learnerNotificationHistoryQuerySchema } from "./learner-notification-history-model";

/**
 * Current persisted membership/user/role is required on every page.
 * The keyset cursor changes ordering only, never recipient ownership.
 */
export async function getOwnLearnerNotificationHistory(
  context: RequestContext,
  rawQuery: unknown,
) {
  const query = learnerNotificationHistoryQuerySchema.parse(rawQuery);
  const membership = requireLearnerNotificationsAccess(context);
  requirePermission(context, "academics.read", {
    collegeId: membership.collegeId,
    organizationId: membership.organizationId,
  });

  const [persisted] = await getDb().select({
    userId: collegeMemberships.userId,
    collegeId: collegeMemberships.collegeId,
    status: collegeMemberships.status,
    platformStatus: users.platformStatus,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(eq(collegeMemberships.id, membership.id))
    .limit(1);

  if (!persisted || persisted.userId !== context.user.id ||
      persisted.collegeId !== membership.collegeId ||
      persisted.status !== "ACTIVE" ||
      persisted.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("academics.read");
  }
  const unreadOnly = query.unread === "1";
  const result = await listOwnNotificationPage(context, {
    limit: 40,
    unreadOnly,
    ...(query.beforeAt && query.beforeId
      ? { beforeCreatedAt: new Date(query.beforeAt), beforeId: query.beforeId }
      : {}),
  });
  return { ...result, unreadOnly, isOlderPage: Boolean(query.beforeAt) };
}
