import { getCurrentRequestContext } from "@/auth/request-context";
import {
  NotificationList,
  type NotificationListItem,
} from "@/components/activity/notification-list";
import { PageHeader } from "@/components/ui/page-header";
import { listOwnNotifications } from "@/modules/activity/notification-service";

export default async function NotificationsPage() {
  const context =
    await getCurrentRequestContext();
  const rows =
    await listOwnNotifications(
      context,
      { limit: 60 },
    );

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
      <NotificationList items={items} />
    </div>
  );
}
