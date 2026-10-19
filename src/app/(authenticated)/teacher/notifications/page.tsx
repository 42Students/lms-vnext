import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  NotificationList,
  type NotificationListItem,
} from "@/components/activity/notification-list";
import { NotificationToolbar } from "@/components/activity/notification-toolbar";
import { AnnouncementFeed } from "@/components/announcements/announcement-feed";
import { PageHeader } from "@/components/ui/page-header";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import {
  countOwnUnreadNotifications,
  listOwnNotificationPage,
} from "@/modules/activity/notification-service";
import { parseFacultyInboxQuery } from "@/modules/courses/faculty-inbox-query-model";
import { facultyNotificationActionHref } from "@/modules/courses/faculty-notification-link-model";
import { requireFacultyNotificationsAccess } from "@/modules/activity/faculty-notifications-access";

const FACULTY_INBOX = "/teacher/notifications";

export default async function FacultyNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    beforeCreatedAt?: string;
    beforeId?: string;
  }>;
}) {
  const context = await getCurrentRequestContext();
  const membership = requireFacultyNotificationsAccess(context);

  const { view, cursor, invalid } = parseFacultyInboxQuery(await searchParams);
  const announcementsEnabled = announcementsRuntimeEnabled();
  const [page, unreadCount, announcements] = await Promise.all([
    invalid
      ? Promise.resolve({ items: [], nextCursor: null })
      : listOwnNotificationPage(context, {
          limit: 50,
          unreadOnly: view === "unread",
          collegeId: membership.collegeId,
          ...(cursor ?? {}),
        }),
    countOwnUnreadNotifications(context, { collegeId: membership.collegeId }),
    announcementsEnabled
      ? listVisibleAnnouncementsForMembership(context)
      : Promise.resolve([]),
  ]);

  const nextHref = page.nextCursor
    ? FACULTY_INBOX + "?" + new URLSearchParams({
        view,
        beforeCreatedAt: page.nextCursor.beforeCreatedAt.toISOString(),
        beforeId: page.nextCursor.beforeId,
      }).toString()
    : null;

  const items: NotificationListItem[] = page.items.map(({ notification, event }) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    actionHref: facultyNotificationActionHref(notification.actionHref),
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
    module: event.module,
    importance: event.importance,
  }));

  return (
    <div className="min-w-0 max-w-full space-y-8">
      <PageHeader
        title="Notifications"
      />
      <AnnouncementFeed
        enabled={announcementsEnabled}
        items={announcements.map((announcement) => ({
          id: announcement.id,
          title: announcement.title,
          message: announcement.message,
          senderType: announcement.senderType,
          receiverType: announcement.receiverType,
          isPinned: announcement.isPinned,
          createdAt: announcement.createdAt,
        }))}
      />
      <section aria-labelledby="faculty-personal-notifications" className="space-y-4">
        <h2 id="faculty-personal-notifications" className="text-lg font-semibold text-foreground">
          Personal notifications
        </h2>
        <NotificationToolbar view={view} unreadCount={unreadCount} baseHref={FACULTY_INBOX}
          markAllEndpoint="/api/notifications/faculty/read-all" />
        {invalid ? (
          <div role="alert" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 text-sm text-foreground">
            The notification filters or page link are invalid.{" "}
            <Link href={FACULTY_INBOX + "?view=" + view}
              className="font-semibold text-primary-text underline inline-flex min-h-11 sm:min-h-9 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Return to the newest notifications
            </Link>
          </div>
        ) : (
          <>
            <NotificationList
              readEndpoint="/api/notifications/faculty"
              items={items}
              emptyText={view === "unread" ? "No unread notifications." : "Nothing yet."}
            />
            {nextHref ? (
              <div className="flex justify-center">
                <Link href={nextHref}
                  className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Older notifications
                </Link>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
