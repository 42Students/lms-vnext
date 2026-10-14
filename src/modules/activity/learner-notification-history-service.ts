import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { requirePersistedLearnerNotificationMembership } from "./learner-notification-membership-service";
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
  const membership = await requirePersistedLearnerNotificationMembership(context);
  const unreadOnly = query.unread === "1";
  const result = await listOwnNotificationPage(context, {
    limit: 40,
    unreadOnly,
    collegeId: membership.collegeId,
    ...(query.beforeAt && query.beforeId
      ? { beforeCreatedAt: new Date(query.beforeAt), beforeId: query.beforeId }
      : {}),
  });
  return { ...result, unreadOnly, isOlderPage: Boolean(query.beforeAt) };
}
