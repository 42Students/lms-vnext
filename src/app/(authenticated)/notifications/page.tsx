import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  NotificationList,
  type NotificationListItem,
} from "@/components/activity/notification-list";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationToolbar } from "@/components/activity/notification-toolbar";
import { countOwnUnreadNotifications, listOwnNotificationPage } from "@/modules/activity/notification-service";
import { parseNotificationCursor } from "@/modules/activity/notification-cursor";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; beforeCreatedAt?: string; beforeId?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "unread" ? "unread" : "all";
  const context = await getCurrentRequestContext();
  const parsedCursor = parseNotificationCursor({
    beforeCreatedAt: params.beforeCreatedAt,
    beforeId: params.beforeId,
  });
  const [page, unreadCount] = await Promise.all([
    parsedCursor.invalid
      ? Promise.resolve({ items: [], nextCursor: null })
      : listOwnNotificationPage(context, {
          limit: 50,
          unreadOnly: view === "unread",
          ...(parsedCursor.cursor ?? {}),
        }),
    countOwnUnreadNotifications(context),
  ]);
  const nextHref = page.nextCursor
    ? "/notifications?" + new URLSearchParams({
        view,
        beforeCreatedAt: page.nextCursor.beforeCreatedAt.toISOString(),
        beforeId: page.nextCursor.beforeId,
      }).toString()
    : null;

  const items: NotificationListItem[] =
    page.items.map(
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
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Deterministic workflow updates that need your attention, separate from noisy technical events."
      />
      <NotificationToolbar view={view} unreadCount={unreadCount} />
      {parsedCursor.invalid ? (
        <div role="alert" className="rounded-[var(--lms-canvas-radius,12px)] border border-border bg-primary-subtle p-4 text-sm text-foreground">
          The notification page link is invalid.{" "}
          <Link href={view === "unread" ? "/notifications?view=unread" : "/notifications?view=all"} className="font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Return to the newest notifications
          </Link>
        </div>
      ) : (
        <>
          <NotificationList
            items={items}
            emptyText={view === "unread" ? "No unread notifications." : "Nothing yet."}
          />
          {nextHref ? (
            <div className="flex justify-center">
              <Link href={nextHref} className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-canvas-radius,12px)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Older notifications
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
