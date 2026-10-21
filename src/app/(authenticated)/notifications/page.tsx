import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  NotificationList,
  type NotificationListItem,
} from "@/components/activity/notification-list";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { NotificationToolbar } from "@/components/activity/notification-toolbar";
import {countOwnUnreadNotifications,listOwnNotificationPage,
 countOwnUnreadNotificationCategory,ownNotificationCategoryChoices,
 type OwnNotificationCategory} from "@/modules/activity/notification-service";
import { parseNotificationCursor } from "@/modules/activity/notification-cursor";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; category?: string; beforeCreatedAt?: string; beforeId?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "unread" ? "unread" : "all";
  const context = await getCurrentRequestContext();
  const categoryChoices=ownNotificationCategoryChoices(context);
  const category=categoryChoices.some(item=>item.id===params.category)
    ?params.category as OwnNotificationCategory:undefined;
  const invalidCategory=Boolean(params.category&&!category);
  const categoryCounts=await Promise.all(categoryChoices.map(async item=>({
   id:item.id,label:item.label,
   unread:await countOwnUnreadNotificationCategory(context,item.id),
  })));
  const parsedCursor = parseNotificationCursor({
    beforeCreatedAt: params.beforeCreatedAt,
    beforeId: params.beforeId,
  });
  const [page, unreadCount] = await Promise.all([
    parsedCursor.invalid || invalidCategory
      ? Promise.resolve({ items: [], nextCursor: null })
      : listOwnNotificationPage(context, {
          limit: 50,
          unreadOnly: view === "unread",
          ...(category?{category}:{}),
          ...(parsedCursor.cursor ?? {}),
        }),
    countOwnUnreadNotifications(context),
  ]);
  const nextHref = page.nextCursor
    ? "/notifications?" + new URLSearchParams({
        view,
        ...(category?{category}:{}),
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
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader
        title="Notifications"
        description="Deterministic workflow updates that need your attention, separate from noisy technical events."
      />
      <NotificationToolbar view={view} unreadCount={unreadCount}
        categories={categoryCounts} selectedCategory={category} />
      {parsedCursor.invalid || invalidCategory ? (
        <Alert tone="error">
          The notification page link or category is invalid.{" "}
          <Link href={view === "unread" ? "/notifications?view=unread" : "/notifications?view=all"} className="font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
            Return to the newest notifications
          </Link>
        </Alert>
      ) : (
        <>
          <NotificationList
            items={items}
            emptyText={view === "unread" ? "No unread notifications." : "Nothing yet."}
            emptyAction={view === "unread" ? <Link href="/notifications?view=all" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9">All</Link> : null}
          />
          {nextHref ? (
            <div className="flex justify-center">
              <Link href={nextHref} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text min-[768px]:min-h-9 min-[768px]:w-auto hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                Older notifications
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
