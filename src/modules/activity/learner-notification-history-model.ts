import { z } from "zod";

export const learnerNotificationHistoryQuerySchema = z.object({
  unread: z.literal("1").optional(),
  beforeAt: z.string().datetime({ offset: true }).optional(),
  beforeId: z.string().uuid().optional(),
}).strict().refine(
  (value) => Boolean(value.beforeAt) === Boolean(value.beforeId),
  "A notification cursor needs both its timestamp and ID",
);

export type LearnerNotificationHistoryQuery =
  z.infer<typeof learnerNotificationHistoryQuerySchema>;

export function learnerNotificationHistoryHref(
  cursor: { beforeCreatedAt: Date; beforeId: string } | null,
  unreadOnly: boolean,
) {
  const search = new URLSearchParams();
  if (unreadOnly) search.set("unread", "1");
  if (cursor) {
    search.set("beforeAt", cursor.beforeCreatedAt.toISOString());
    search.set("beforeId", cursor.beforeId);
  }
  const query = search.toString();
  return "/learn/notifications/history" + (query ? "?" + query : "");
}

export function learnerNotificationHistoryEmptyState(
  pageLength: number,
  isOlderPage: boolean,
  unreadOnly: boolean,
) {
  if (pageLength > 0) return null;
  if (isOlderPage) return "No older matching notifications were found.";
  return unreadOnly
    ? "You have no unread personal notifications."
    : "No personal notifications have been recorded for your account.";
}
