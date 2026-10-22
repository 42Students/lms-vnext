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
  limit?:string|string[];
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
    limit:first(raw.limit)??undefined,
    beforeCreatedAt: first(raw.beforeCreatedAt) ?? undefined,
    beforeId: first(raw.beforeId) ?? undefined,
  });
  if (!parsed.success) {
    return (
      <section className="min-w-0 space-y-4">
        <PageHeader title="Invalid notification filters" />
        <Alert tone="error"><Link href={TPO_NOTIFICATIONS_PATH} className="inline-flex min-h-11 items-center text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Return to newest notifications
        </Link></Alert>
      </section>
    );
  }
  let inbox: Awaited<ReturnType<typeof getTpoPersonalInbox>>;
  try {
    inbox = await getTpoPersonalInbox(context, parsed.data);
  } catch {
    return <section className="min-w-0 space-y-4">
      <PageHeader title="Notifications" />
      <Alert tone="error">
        Could not load notifications.{" "}
        <Link href={TPO_NOTIFICATIONS_PATH}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">
          Retry
        </Link>
      </Alert>
    </section>;
  }
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
  const firstPage=!inbox.query.beforeCreatedAt&&!inbox.query.beforeId;
  const canExpand=firstPage&&Boolean(inbox.page.nextCursor)&&inbox.query.limit<200;
  const nextHref=inbox.page.nextCursor?(canExpand?
    tpoInboxPageHref(inbox.query.view,undefined,inbox.query.limit+50):
    tpoInboxPageHref(inbox.query.view,inbox.page.nextCursor)):null;
  const olderUnread=Math.max(0,inbox.unreadCount-items.filter(item=>!item.readAt).length);
  return (
    <div className="min-w-0 space-y-4">
      <PageHeader
        title="Notifications"
        description="A clean history of what happened across placements. Actionable work stays on Home under Needs you."
        actions={<NotificationToolbar display="mark-all" view={inbox.query.view}
          unreadCount={inbox.unreadCount} baseHref={TPO_NOTIFICATIONS_PATH}
          markAllEndpoint="/api/tpo/notifications/read-all"/>}
      />
      <TpoNotificationRefresh/>
      {inbox.cursor.invalid ? (
        <Alert tone="error">
          The notification page link is invalid.{" "}
          <Link href={tpoInboxPageHref(inbox.query.view)} className="font-semibold text-[var(--lms-teal-deep)] underline">
            Return to newest notifications
          </Link>
        </Alert>
      ) : (
        <>
          {firstPage&&olderUnread>0?<Alert tone="info">
            {olderUnread} unread {olderUnread===1?"is":"are"} older than what is shown. Show older to view the history; Mark all as read clears older ones too.
          </Alert>:null}
          <section aria-label="Notification feed" className="min-w-0 overflow-hidden rounded-[14px] border border-[var(--lms-canvas-border)] bg-white shadow-[0_5px_20px_rgba(26,45,72,0.05)]">
            <div className="border-b border-border px-3 py-3 md:px-5">
              <NotificationToolbar display="filters" segmented view={inbox.query.view}
                unreadCount={inbox.unreadCount}
                allLabel={firstPage?(inbox.page.nextCursor?"Latest "+items.length:"All ("+items.length+")"):"Older ("+items.length+")"}
                baseHref={TPO_NOTIFICATIONS_PATH} markAllEndpoint="/api/tpo/notifications/read-all"/>
            </div>
            <div className={notificationStyles["feed"]}>
            <NotificationList
            variant="tpo"
            items={items}
            emptyAction={emptyNavigation ? <p role="status" className="mt-4 text-sm text-body leading-[22px]">Your unread inbox is clear.{" "} <Link href={emptyNavigation.href} className="font-semibold text-[var(--lms-teal-deep)] underline">{emptyNavigation.label}</Link></p> : null}
            readEndpoint="/api/tpo/notifications"
            emptyText={inbox.query.view === "unread" ? (firstPage?"No unread notifications":"No unread notifications on this page. Return to latest to review earlier unread items.") : "Nothing yet"}
          />
            </div>
          </section>
          {inbox.query.limit===200&&nextHref?<p role="note" className="text-xs text-muted-foreground">Latest 200 notifications shown. Show older opens the next page of history.</p>:null}
          {nextHref ? (
            <div className="flex justify-stretch min-[768px]:justify-center">
              <Link
                href={nextHref}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-body-text)] hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:w-auto"
              >
                Show older
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
