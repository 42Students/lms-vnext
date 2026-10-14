import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { countOwnUnreadNotifications, listOwnNotifications } from "@/modules/activity/notification-service";
import { collegeNoticeInboxProjection, collegeNoticeInboxQuerySchema }
  from "./college-notice-inbox-model";

/** Registered in_app_notifications, owned by the signed-in user and
 * scoped by the source activity event college. NOT a college-wide broadcast. */
export async function getCollegeNoticeInbox(context: RequestContext, raw: unknown = {}) {
  const filter = collegeNoticeInboxQuerySchema.parse(raw);
  const own = context.membership;
  if (!own || own.status !== "ACTIVE" || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "college.read", { collegeId: own.collegeId, organizationId: own.organizationId }))
    throw new AuthorizationError("college.read");
  requirePermission(context, "college.read", {
    collegeId: own.collegeId, organizationId: own.organizationId,
  });
  const [rows, unreadCount] = await Promise.all([
    listOwnNotifications(context, {
    collegeId: own.collegeId, unreadOnly: filter.unreadOnly === "1", limit: 50,
  }),
    countOwnUnreadNotifications(context, { collegeId:own.collegeId }),
  ]);
  return {
    items: collegeNoticeInboxProjection(rows.map(row => ({
      id: row.notification.id,
      title: row.notification.title,
      body: row.notification.body,
      actionHref: row.notification.actionHref,
      createdAt: row.notification.createdAt,
      readAt: row.notification.readAt,
    }))),
    capped: rows.length === 50,
    unreadCount,
  };
}
