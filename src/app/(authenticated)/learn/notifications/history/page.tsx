import { redirect } from "next/navigation";
import { hasActiveMembership, hasMembershipRole } from "@/modules/identity/context";
import { getCurrentRequestContext } from "@/auth/request-context";
import { NotificationList, type NotificationListItem } from "@/components/activity/notification-list";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnLearnerNotificationHistory } from "@/modules/activity/learner-notification-history-service";
import {
  learnerNotificationHistoryEmptyState,
  learnerNotificationHistoryHref,
  learnerNotificationHistoryQuerySchema,
} from "@/modules/activity/learner-notification-history-model";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";

import { ROLE } from "@/modules/identity/roles";
export default async function LearnerNotificationHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    beforeAt?: string | string[];
    beforeId?: string | string[];
    unread?: string | string[];
  }>;
}) {
  const context = await getCurrentRequestContext();
  if (!hasActiveMembership(context) || !hasMembershipRole(context,ROLE.LEARNER)) redirect("/dashboard");
  const raw = await searchParams;
  const parsed = learnerNotificationHistoryQuerySchema.safeParse(raw);
  if (!parsed.success) return <section role="alert" className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Personal notification history" description="Invalid history filters" />
    <p className="text-sm text-body">That history link is invalid or expired. No personal notifications were loaded.</p>
    <TextLink href="/learn/notifications/history" className="inline-flex min-h-11 items-center">View newest history</TextLink>
  </section>;

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
      <TextLink href="/learn/notifications"
        className="inline-flex min-h-11 md:min-h-9 items-center text-[13px]">
        ← Notifications
      </TextLink>
      <PageHeader
        title="Personal notification history"
        description="Browse your recorded personal notifications beyond the latest inbox items. College announcements use the main Notifications page."
      />
      <nav aria-label="Notification history filters" className="flex min-w-0 gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible md:pb-0">
        <TextLink variant="bare" href="/learn/notifications/history"
          aria-current={!page.unreadOnly ? "page" : undefined}
          className={!page.unreadOnly ? "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-[var(--lms-control-radius)] border border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 text-sm font-medium text-[var(--lms-primary-text)] hover:bg-[var(--lms-primary-subtle)] md:min-h-9" : "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 text-sm font-medium text-body hover:border-primary hover:bg-[color-mix(in_srgb,var(--lms-primary)_7%,transparent)] md:min-h-9"}>
          All personal
        </TextLink>
        <TextLink variant="bare" href="/learn/notifications/history?unread=1"
          aria-current={page.unreadOnly ? "page" : undefined}
          className={page.unreadOnly ? "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-[var(--lms-control-radius)] border border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 text-sm font-medium text-[var(--lms-primary-text)] hover:bg-[var(--lms-primary-subtle)] md:min-h-9" : "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 text-sm font-medium text-body hover:border-primary hover:bg-[color-mix(in_srgb,var(--lms-primary)_7%,transparent)] md:min-h-9"}>
          Unread only
        </TextLink>
      </nav>
      <p className="max-w-2xl text-sm leading-[22px] text-body">
        Showing {items.length} notifications on this page, newest first.
        Counts are page-local; this is not a complete-inbox count.
      </p>
      {emptyMessage ? (
        <section role="status" className="border-y border-[var(--lms-canvas-border)] px-2 py-6 text-center">
          <p className="text-sm text-body leading-[22px]">{emptyMessage}</p>
        </section>
      ) : (
        <NotificationList items={items} readEndpoint="/api/learn/notifications" />
      )}
      <nav aria-label="Notification history pages" className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        {page.nextCursor ? (
          <ButtonLink variant="secondary"
            href={learnerNotificationHistoryHref(page.nextCursor, page.unreadOnly)}
            className="w-full sm:w-auto"
          >
            Older notifications →
          </ButtonLink>
        ) : (
          <p className="text-sm text-muted-foreground leading-[22px]">No further older notifications in this view.</p>
        )}
        {page.isOlderPage ? (
          <TextLink
            href={learnerNotificationHistoryHref(null, page.unreadOnly)}
            className="inline-flex min-h-11 md:min-h-9 items-center text-[13px]"
          >
            Return to newest
          </TextLink>
        ) : null}
      </nav>
      <p className="text-xs text-muted-foreground leading-5">
        Personal notification read actions use the existing same-origin protected route.
        Announcements are not assigned a personal read state.
      </p>
    </div>
  );
}
