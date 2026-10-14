import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, users } from "@/db/schema";
import {
  hasActiveMembership, hasMembershipRole, type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { countOwnUnreadNotifications, listOwnNotificationPage } from "./notification-service";
import { resolveMentorInboxQuery } from "./mentor-notifications-model";

/**
 * Personal Mentor inbox: verify live role grants in migrated tables, not only
 * a caller-provided context role. Reuse the existing owner-only cursor reader.
 */
export async function getMentorPersonalInbox(context: RequestContext, rawQuery: unknown) {
  const { query, cursor } = resolveMentorInboxQuery(rawQuery);
  const membership = context.membership;
  if (!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context, "MENTOR")) {
    throw new AuthorizationError("academics.read");
  }
  requirePermission(context, "academics.read", {
    organizationId: membership.organizationId,
    collegeId: membership.collegeId,
  });
  const [persisted] = await getDb().select({ id: collegeMemberships.id })
    .from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"MENTOR"),
    ))
    .where(and(
      eq(collegeMemberships.id,membership.id),
      eq(collegeMemberships.collegeId,membership.collegeId),
      eq(collegeMemberships.userId,context.user.id),
      eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE"),
    )).limit(1);
  if (!persisted) throw new AuthorizationError("academics.read");
  const [page,unreadCount] = await Promise.all([
    cursor.invalid
      ? Promise.resolve({items:[],nextCursor:null})
      : listOwnNotificationPage(context,{
        limit:50,unreadOnly:query.view==="unread",
        ...(cursor.cursor ?? {}),
      }),
    countOwnUnreadNotifications(context),
  ]);
  return { query, cursor, page, unreadCount };
}
