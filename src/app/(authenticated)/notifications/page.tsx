import { getCurrentRequestContext } from "@/auth/request-context";
import {
  NotificationList,
  type NotificationListItem,
} from "@/components/activity/notification-list";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationToolbar } from "@/components/activity/notification-toolbar";
import { countOwnUnreadNotifications, listOwnNotifications } from "@/modules/activity/notification-service";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "unread" ? "unread" : "all";
  const context =
    await getCurrentRequestContext();
  const [rows, unreadCount] = await Promise.all([
    listOwnNotifications(context, { limit: 100, unreadOnly: view === "unread" }),
    countOwnUnreadNotifications(context),
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
        eyebrow="Inbox"
        title="Notifications"
        description="Deterministic workflow updates that need your attention, separate from noisy technical events."
      />
      <NotificationToolbar view={view} unreadCount={unreadCount} />
      <NotificationList items={items} />
      {items.length === 100 ? (
        <p className="text-sm text-muted-foreground">
          Showing the latest 100 notifications. Older notifications are not included in this view.
        </p>
      ) : null}
    </div>
  );
}
