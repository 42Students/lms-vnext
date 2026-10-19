import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { NotificationList, type NotificationListItem } from "@/components/activity/notification-list";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnLearnerNotificationHistory } from "@/modules/activity/learner-notification-history-service";
import {
  learnerNotificationHistoryEmptyState,
  learnerNotificationHistoryHref,
  learnerNotificationHistoryQuerySchema,
} from "@/modules/activity/learner-notification-history-model";

export default async function LearnerNotificationHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    beforeAt?: string | string[];
    beforeId?: string | string[];
    unread?: string | string[];
  }>;
}) {
  const raw = await searchParams;
  const parsed = learnerNotificationHistoryQuerySchema.safeParse(raw);
  if (!parsed.success) notFound();

  const context = await getCurrentRequestContext();
  const page = await getOwnLearnerNotificationHistory(context, parsed.data);
  const items: NotificationListItem[] = page.items.map(({ notification, event }) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    actionHref: notification.actionHref,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
    module: event.module,
    importance: event.importance,
  }));
  const emptyMessage = learnerNotificationHistoryEmptyState(
    items.length,
    page.isOlderPage,
    page.unreadOnly,
  );

  return (
    <div className="min-w-0 space-y-6">
      <Link href="/learn/notifications"
        className="inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text hover:underline">
        ← Notifications
      </Link>
      <PageHeader eyebrow="Learner · Notifications"
        title="Personal notification history"
        description="Browse your recorded personal notifications beyond the latest inbox items. College announcements use the main Notifications page."
      />
      <nav aria-label="Notification history filters" className="flex flex-wrap gap-2">
        <Link href="/learn/notifications/history"
          aria-current={!page.unreadOnly ? "page" : undefined}
          className="inline-flex min-h-9 sm:min-h-9 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
          All personal
        </Link>
        <Link href="/learn/notifications/history?unread=1"
          aria-current={page.unreadOnly ? "page" : undefined}
          className="inline-flex min-h-9 sm:min-h-9 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
          Unread only
        </Link>
      </nav>
      <p className="text-sm text-body">
        Showing {items.length} notifications on this page, newest first.
        Counts are page-local; this is not a complete-inbox count.
      </p>
      {emptyMessage ? (
        <section role="status" className="border-b border-border py-4">
          <p className="text-sm text-body">{emptyMessage}</p>
        </section>
      ) : (
        <NotificationList items={items} readEndpoint="/api/learn/notifications" />
      )}
      <nav aria-label="Notification history pages" className="flex flex-wrap gap-4">
        {page.nextCursor ? (
          <Link
            href={learnerNotificationHistoryHref(page.nextCursor, page.unreadOnly)}
            className="inline-flex min-h-9 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
          >
            Older notifications →
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">No further older notifications in this view.</p>
        )}
        {page.isOlderPage ? (
          <Link
            href={learnerNotificationHistoryHref(null, page.unreadOnly)}
            className="inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text hover:underline"
          >
            Return to newest
          </Link>
        ) : null}
      </nav>
      <p className="text-xs text-muted-foreground">
        Personal notification read actions use the existing same-origin protected route.
        Announcements are not assigned a personal read state.
      </p>
    </div>
  );
}
