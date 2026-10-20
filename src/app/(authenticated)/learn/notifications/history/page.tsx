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
    <div className="min-w-0 space-y-5">
      <Link href="/learn/notifications"
        className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-[13px] font-semibold text-[var(--lms-link-text)] underline hover:underline">
        ← Notifications
      </Link>
      <PageHeader
        title="Personal notification history"
        description="Browse your recorded personal notifications beyond the latest inbox items. College announcements use the main Notifications page."
      />
      <nav aria-label="Notification history filters" className="flex min-w-0 gap-2 overflow-x-auto pb-2 min-[768px]:flex-wrap min-[768px]:overflow-visible min-[768px]:pb-0">
        <Link href="/learn/notifications/history"
          aria-current={!page.unreadOnly ? "page" : undefined}
          className={!page.unreadOnly ? "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-[var(--lms-control-radius)] border border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 text-sm font-medium text-[var(--lms-primary-text)] hover:bg-[var(--lms-primary-subtle)] min-[768px]:min-h-9" : "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-4 text-sm font-medium text-body hover:border-primary hover:bg-[rgba(38,186,199,0.07)] min-[768px]:min-h-9"}>
          All personal
        </Link>
        <Link href="/learn/notifications/history?unread=1"
          aria-current={page.unreadOnly ? "page" : undefined}
          className={page.unreadOnly ? "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-[var(--lms-control-radius)] border border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 text-sm font-medium text-[var(--lms-primary-text)] hover:bg-[var(--lms-primary-subtle)] min-[768px]:min-h-9" : "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-4 text-sm font-medium text-body hover:border-primary hover:bg-[rgba(38,186,199,0.07)] min-[768px]:min-h-9"}>
          Unread only
        </Link>
      </nav>
      <p className="max-w-2xl text-sm leading-6 text-body">
        Showing {items.length} notifications on this page, newest first.
        Counts are page-local; this is not a complete-inbox count.
      </p>
      {emptyMessage ? (
        <section role="status" className="border-y border-[var(--lms-canvas-border)] px-2 py-6 text-center">
          <p className="text-sm text-body">{emptyMessage}</p>
        </section>
      ) : (
        <NotificationList items={items} readEndpoint="/api/learn/notifications" />
      )}
      <nav aria-label="Notification history pages" className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        {page.nextCursor ? (
          <Link
            href={learnerNotificationHistoryHref(page.nextCursor, page.unreadOnly)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:w-auto md:min-h-9"
          >
            Older notifications →
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">No further older notifications in this view.</p>
        )}
        {page.isOlderPage ? (
          <Link
            href={learnerNotificationHistoryHref(null, page.unreadOnly)}
            className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-[13px] font-semibold text-[var(--lms-link-text)] underline hover:underline"
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
