import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  NotificationList,
  type NotificationListItem,
} from "@/components/activity/notification-list";
import { NotificationToolbar } from "@/components/activity/notification-toolbar";
import { AnnouncementFeed } from "@/components/announcements/announcement-feed";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { AuthorizationError } from "@/modules/permissions/policy";
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
    view?: string | string[];
    tab?: string | string[];
    beforeCreatedAt?: string | string[];
    beforeId?: string | string[];
  }>;
}) {
  const context = await getCurrentRequestContext();
  const membership = requireFacultyNotificationsAccess(context);

  const { tab, ...query } = await searchParams;
  const scopeTabs = ["all", "personal", "college", "department", "faculty"] as const;
  // Keep the old ?tab= deep links without treating an invalid tab as a
  // query for a foreign or unfiltered recipient.
  if (tab !== undefined &&
      (typeof tab !== "string" || !scopeTabs.includes(tab as typeof scopeTabs[number]))) {
    redirect(FACULTY_INBOX + "?view=all");
  }
  const scopeTab = typeof tab === "string" ? tab : "all";
  const { view, cursor, invalid } = parseFacultyInboxQuery(query);
  const announcementsEnabled = announcementsRuntimeEnabled();
  const [page, unreadCount, announcementRead] = await Promise.all([
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
          .then(items => ({ available: true as const, items }))
          .catch(error => {
            if (error instanceof AuthorizationError) throw error;
            return { available: false as const, items: [] };
          })
      : Promise.resolve({ available: false as const, items: [] }),
  ]);
  const announcements = announcementRead.items.filter(item =>
    scopeTab === "all" ||
    (scopeTab !== "personal" && item.receiverType.toLowerCase() === scopeTab),
  );

  const nextHref = page.nextCursor
    ? FACULTY_INBOX + "?" + new URLSearchParams({
        view,
        ...(scopeTab !== "all" ? { tab: scopeTab } : {}),
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
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader title="Notifications" />
      <NotificationToolbar view={view} unreadCount={unreadCount} baseHref={FACULTY_INBOX}
        markAllEndpoint="/api/notifications/faculty/read-all" categoryParam="tab" selectedCategory={scopeTab}
        categories={[
         {id:"all",label:"All",unread:page.items.length+announcementRead.items.length},
         {id:"college",label:"College",unread:announcementRead.items.filter(item=>item.receiverType.toLowerCase()==="college").length},
         {id:"department",label:"Department",unread:announcementRead.items.filter(item=>item.receiverType.toLowerCase()==="department").length},
         {id:"faculty",label:"Faculty",unread:announcementRead.items.filter(item=>item.receiverType.toLowerCase()==="faculty").length},
         {id:"personal",label:"Personal",unread:page.items.length},
        ]}/>
      {scopeTab === "all" || scopeTab === "personal" ? (
      <section aria-labelledby="faculty-personal-notifications" className="space-y-4">
        <h2 id="faculty-personal-notifications" className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">
          Personal notifications
        </h2>
        {invalid ? (
          <Alert tone="error">
            The notification filters or page link are invalid.{" "}
            <Link href={FACULTY_INBOX + "?view=" + view}
              className="font-semibold text-primary-text underline inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
              Return to the newest notifications
            </Link>
          </Alert>
        ) : (
          <>
            <NotificationList
              readEndpoint="/api/notifications/faculty"
              items={items}
              emptyText={view === "unread" ? "No unread notifications." : "Nothing yet."}
            />
            {nextHref ? (
              <div className="flex min-w-0 justify-start">
                <Link href={nextHref}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] sm:w-auto md:min-h-[var(--lms-control-height)] border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                  Older notifications
                </Link>
              </div>
            ) : null}
          </>
        )}
      </section>
      ) : null}
      {announcementsEnabled && !announcementRead.available ? (
        <Alert tone="warning">
          Couldn't refresh notifications. Your personal notifications remain available.
          <Link href={FACULTY_INBOX} className="ml-2 font-semibold text-primary-text underline">Retry</Link>
        </Alert>
      ) : scopeTab !== "personal" ? <AnnouncementFeed
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
      /> : null}
    </div>
  );
}
