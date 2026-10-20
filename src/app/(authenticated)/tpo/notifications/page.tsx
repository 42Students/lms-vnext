import Link from "next/link";
import {TpoNotificationRefresh} from "@/components/tpo/tpo-notification-refresh";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  NotificationList,
  type NotificationListItem,
} from "@/components/activity/notification-list";
import { NotificationToolbar } from "@/components/activity/notification-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import notificationStyles from "@/components/tpo/legacy-tpo-notification-feed.module.css";
import { Alert } from "@/components/ui/alert";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  TPO_NOTIFICATIONS_PATH,
  tpoInboxPageHref,
  tpoInboxQuerySchema,
  tpoInboxEmptyNavigation,
  tpoEffectiveReadAt,
} from "@/modules/activity/tpo-notifications-model";
import { getTpoPersonalInbox } from "@/modules/activity/tpo-notifications-service";

export const dynamic = "force-dynamic";

type Params = {
  view?: string | string[];
  beforeCreatedAt?: string | string[];
  beforeId?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const raw = await searchParams;
  const parsed = tpoInboxQuerySchema.safeParse({
    view: first(raw.view) ?? undefined,
    beforeCreatedAt: first(raw.beforeCreatedAt) ?? undefined,
    beforeId: first(raw.beforeId) ?? undefined,
  });
  if (!parsed.success) {
    return (
      <section className="space-y-3">
        <PageHeader title="Invalid notification filters" />
        <Alert tone="error"><Link href={TPO_NOTIFICATIONS_PATH} className="text-primary-text underline">
          Return to newest notifications
        </Link></Alert>
      </section>
    );
  }
  const inbox = await getTpoPersonalInbox(context, parsed.data);
  const items: NotificationListItem[] = inbox.page.items.map(({ notification, event }) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    actionHref: notification.actionHref,
    readAt: tpoEffectiveReadAt(notification.readAt,notification.createdAt,inbox.recentCutoff)?.toISOString()??null,
    createdAt: notification.createdAt.toISOString(),
    module: event.module,
    importance: event.importance,
  }));
  const emptyNavigation=tpoInboxEmptyNavigation(inbox.query.view,items.length);
  const nextHref = inbox.page.nextCursor
    ? tpoInboxPageHref(inbox.query.view, inbox.page.nextCursor)
    : null;
  const olderUnread=Math.max(0,inbox.unreadCount-items.filter(item=>!item.readAt).length);
  const firstPage=!inbox.query.beforeCreatedAt&&!inbox.query.beforeId;
  return (
    <div className="space-y-6">
      <TpoNotificationRefresh/>
      <PageHeader
        title="Notifications"
        description="A clean history of what happened across placements. Actionable work stays on Home under Needs you."
      />
      <NotificationToolbar
        view={inbox.query.view}
        unreadCount={inbox.unreadCount}
        allLabel={nextHref?"Latest "+items.length:"All ("+items.length+")"}
        baseHref={TPO_NOTIFICATIONS_PATH}
        markAllEndpoint="/api/tpo/notifications/read-all"
      />
      {inbox.cursor.invalid ? (
        <Alert tone="error">
          The notification page link is invalid.{" "}
          <Link href={tpoInboxPageHref(inbox.query.view)} className="font-semibold text-[var(--lms-teal-deep)] underline">
            Return to newest notifications
          </Link>
        </Alert>
      ) : (
        <>
          <div className={notificationStyles.feed}>
          <NotificationList
            variant="tpo"
            items={items}
            readEndpoint="/api/tpo/notifications"
            emptyText={inbox.query.view === "unread" ? "No unread notifications" : "Nothing yet"}
          />
          </div>
          {firstPage&&olderUnread>0?<p role="status" className="text-sm text-muted-foreground">
            {olderUnread} unread {olderUnread===1?"is":"are"} older than what is shown. Show older to view the history; Mark all as read clears older ones too.
          </p>:null}
          {emptyNavigation?<Alert tone="info">Your unread inbox is clear. <Link href={emptyNavigation.href} className="font-semibold text-[var(--lms-teal-deep)] underline">{emptyNavigation.label}</Link></Alert>:null}
          {nextHref ? (
            <div className="flex justify-center">
              <Link
                href={nextHref}
                className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-body-text)] hover:border-primary hover:bg-primary-subtle"
              >
                Older notifications
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
