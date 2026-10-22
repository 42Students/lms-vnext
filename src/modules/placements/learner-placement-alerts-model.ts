import { safeNotificationActionHref } from "@/modules/activity/notification-action";

export type OwnPlacementAlert = {
  id: string;
  title: string;
  body: string;
  actionHref: string | null;
  createdAt: Date;
  readAt: Date | null;
  eventType?: string;
  subjectType?: string;
};

export function presentOwnLearnerPlacementAlerts(
  rows: readonly OwnPlacementAlert[],
) {
  const timestamp=(date:Date)=>{const parsed=date.getTime();return Number.isFinite(parsed)?parsed:0;};
  return [...rows].sort((a, b) =>
    timestamp(b.createdAt) - timestamp(a.createdAt) ||
    b.id.localeCompare(a.id),
  ).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt,
    unread: row.readAt === null,
    status:row.readAt===null?"UNREAD" as const:"READ" as const,
    source:"IN_APP_NOTIFICATION" as const,
    event:row.eventType??"PLACEMENT_UPDATE",
    subjectType:row.subjectType??null,
    actionHref: safeNotificationActionHref(row.actionHref),
  }));
}
