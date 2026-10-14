import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import type { NotificationListItem } from "@/components/activity/notification-list";
import { PageHeader } from "@/components/ui/page-header";
import { LearnerNotificationsInbox } from "@/components/activity/learner-notifications-inbox";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import { listOwnNotifications } from "@/modules/activity/notification-service";
import { requireLearnerNotificationsAccess } from "@/modules/activity/learner-notifications-access";

export default async function NotificationsPage() {
  const context =
    await getCurrentRequestContext();
  requireLearnerNotificationsAccess(context);
  const announcementsEnabled =
    announcementsRuntimeEnabled();
  const [rows, announcements] =
    await Promise.all([
      listOwnNotifications(
        context,
        { limit: 60 },
      ),
      announcementsEnabled
        ? listVisibleAnnouncementsForMembership(
            context,
          )
        : Promise.resolve([]),
    ]);

  const items: NotificationListItem[] =
    rows.map(
      ({
        notification,
        event,
      }) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        actionHref:
          notification.actionHref,
        readAt:
          notification.readAt?.toISOString() ??
          null,
        createdAt:
          notification.createdAt.toISOString(),
        module: event.module,
        importance:
          event.importance,
      }),
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner"
        title="Notifications"
        description="Your course, project, placement and college notifications."
      />
      <Link href="/learn/notifications/history"
        className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
        Browse older personal notifications →
      </Link>
      <LearnerNotificationsInbox
        personal={items}
        announcementsEnabled={announcementsEnabled}
        announcements={announcements.map((announcement) => ({
          id: announcement.id,
          title: announcement.title,
          message: announcement.message,
          senderType: announcement.senderType,
          receiverType: announcement.receiverType,
          isPinned: announcement.isPinned,
          createdAt: announcement.createdAt,
        }))}
      />
    </div>
  );
}
