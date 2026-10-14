import { safeNotificationActionHref } from "@/modules/activity/notification-action";

export type OwnPlacementAlert = {
  id: string;
  title: string;
  body: string;
  actionHref: string | null;
  createdAt: Date;
  readAt: Date | null;
};

export function presentOwnLearnerPlacementAlerts(
  rows: readonly OwnPlacementAlert[],
) {
  return [...rows].sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime() ||
    b.id.localeCompare(a.id),
  ).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt,
    unread: row.readAt === null,
    actionHref: safeNotificationActionHref(row.actionHref),
  }));
}
