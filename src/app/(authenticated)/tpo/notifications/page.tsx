import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  NotificationList,
  type NotificationListItem,
} from "@/components/activity/notification-list";
import { NotificationToolbar } from "@/components/activity/notification-toolbar";
import { PageHeader } from "@/components/ui/page-header";
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
      <section role="alert" className="space-y-3">
        <h1 className="text-xl font-semibold">Invalid notification filters</h1>
        <Link href={TPO_NOTIFICATIONS_PATH} className="text-primary-text underline">
          Return to newest notifications
        </Link>
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
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO"
        title="Notifications"
        description="A clean history of what happened across placements. Actionable work stays on Home under Needs you."
      />
      <NotificationToolbar
        view={inbox.query.view}
        unreadCount={inbox.unreadCount}
        baseHref={TPO_NOTIFICATIONS_PATH}
        markAllEndpoint="/api/tpo/notifications/read-all"
      />
      {inbox.cursor.invalid ? (
        <div role="alert" className="rounded-xl border border-border bg-surface p-4 text-sm text-foreground">
          The notification page link is invalid.{" "}
          <Link href={tpoInboxPageHref(inbox.query.view)} className="font-semibold text-primary-text underline">
            Return to newest notifications
          </Link>
        </div>
      ) : (
        <>
          <NotificationList
            variant="tpo"
            items={items}
            readEndpoint="/api/tpo/notifications"
            emptyText={inbox.query.view === "unread" ? "No unread notifications." : "No notifications yet."}
          />
          {emptyNavigation?<p role="status" className="rounded-xl border border-border bg-surface p-4">
            Your unread inbox is clear. <Link href={emptyNavigation.href} className="font-semibold text-primary-text underline">{emptyNavigation.label}</Link>
          </p>:null}
          {nextHref ? (
            <div className="flex justify-center">
              <Link
                href={nextHref}
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle"
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
