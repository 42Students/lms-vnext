import "server-only";

import { and, count, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents, collegeMemberships, inAppNotifications, membershipRoles, users } from "@/db/schema";
import {
  hasActiveMembership, hasMembershipRole, type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { listOwnNotificationPage } from "./notification-service";
import { resolveMentorInboxQuery } from "./mentor-notifications-model";

/**
 * Personal Mentor inbox: verify live role grants in migrated tables, not only
 * a caller-provided context role. Reuse the existing owner-only cursor reader.
 */
export async function requirePersistedMentorInboxMembership(context:RequestContext) {
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
  return membership;
}

export async function getMentorPersonalInbox(context: RequestContext, rawQuery: unknown) {
  const {query,cursor}=resolveMentorInboxQuery(rawQuery);
  const membership=await requirePersistedMentorInboxMembership(context);
  const [page,unread] = await Promise.all([
    cursor.invalid
      ? Promise.resolve({items:[],nextCursor:null})
      : listOwnNotificationPage(context,{
        limit:50,unreadOnly:query.view==="unread",
        collegeId:membership.collegeId,
        ...(cursor.cursor ?? {}),
      }),
    getDb().select({total:count()}).from(inAppNotifications)
      .innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
      .where(and(
        eq(inAppNotifications.userId,context.user.id),
        eq(activityEvents.collegeId,membership.collegeId),
        isNull(inAppNotifications.readAt),
      )),
  ]);
  return {query,cursor,page,unreadCount:Number(unread[0]?.total??0)};
}
